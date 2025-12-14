# services/sync_service.py
"""
Sync Service - syncs games from PSN/Steam and matches them to IGDB.

Matching strategy:
1. Exact name match (via Sony 65k title database)
2. Slug match with fallbacks (suffixes, Roman numerals)
3. Release date disambiguation for games with similar names
4. Mark as unmatched if no confident match found
"""
import re
import unicodedata
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from ..models.synced_game import SyncedGame, SyncStatus
from ..models.game import Game
from ..models.psn_title_lookup import PsnTitleLookup
from .psn_service import get_games_by_username


# ═══════════════════════════════════════════════════════════════════
# Non-Game Blocklist - apps/media/demos to filter out during sync
# ═══════════════════════════════════════════════════════════════════

# Exact title matches (case-insensitive)
NON_GAME_TITLES = {
    # Media apps
    "spotify", "netflix", "youtube", "amazon prime video", "hulu", "disney+",
    "apple tv", "crunchyroll", "plex", "twitch", "hbo max", "peacock",
    "paramount+", "amazon video", "vudu", "vidzone", "vrideo", "vrideo vr",
    
    # Utilities & companions
    "headset companion", "playstation app", "remote play", "share factory",
    "media player", "playstation vue", "ps vue",
    
    # News/info apps
    "ign", "gamespot", "polygon",
    
    # Browser/social
    "web browser", "internet browser",
}

# Patterns to match (case-insensitive regex)
NON_GAME_PATTERNS = [
    r"demo disc",           # Demo compilations
    r"playstation\s*vr demo",
    r"^\s*demo\s*$",        # Just "Demo"
    r"trial version",
    r"beta\s+(app|version|client)$",
    r"companion app",
    r"theme\s*(pack)?$",    # Themes
    r"avatar\s*(pack)?$",   # Avatars
]

# Compile patterns for efficiency
_NON_GAME_PATTERNS = [re.compile(p, re.IGNORECASE) for p in NON_GAME_PATTERNS]


def is_non_game(title: str) -> bool:
    """Check if a title is a known non-game (app/media/demo)."""
    if not title:
        return False
    
    title_lower = title.lower().strip()
    
    # Check exact matches
    if title_lower in NON_GAME_TITLES:
        return True
    
    # Check patterns
    for pattern in _NON_GAME_PATTERNS:
        if pattern.search(title):
            return True
    
    return False


class SyncService:
    """Service for syncing external platform games."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def sync_psn(self, user_id: int, psn_username: str) -> dict:
        """
        Sync games from PSN for a user.
        
        Returns:
            { total: int, new: int, updated: int }
        """
        # Cleanup: Delete any existing synced games that match the blocklist
        existing_synced = self.db.query(SyncedGame).filter(
            SyncedGame.user_id == user_id,
            SyncedGame.platform == "psn"
        ).all()
        
        for synced in existing_synced:
            if is_non_game(synced.platform_name):
                self.db.delete(synced)
        
        self.db.commit()
        
        # Fetch games from PSN
        psn_games = get_games_by_username(psn_username)
        
        stats = {"total": len(psn_games), "new": 0, "updated": 0}
        
        for game in psn_games:
            platform_id = game.get("title_id", "")
            if not platform_id:
                continue
            
            # Skip known non-games (apps, media, demos)
            title = game.get("name", "")
            if is_non_game(title):
                stats["total"] -= 1  # Don't count filtered items
                continue
            
            # Check if already synced
            existing = self.db.query(SyncedGame).filter(
                SyncedGame.user_id == user_id,
                SyncedGame.platform == "psn",
                SyncedGame.platform_id == platform_id
            ).first()
            
            if existing:
                # Update existing - but check if we need to reset status
                existing.playtime_minutes = game.get("playtime_minutes")
                existing.last_synced_at = datetime.utcnow()
                
                # Reset skipped games on resync so users can recover accidentally skipped games
                if existing.status == SyncStatus.SKIPPED.value:
                    existing.status = SyncStatus.PENDING.value
                
                # If marked as imported, check if still in library
                if existing.status == SyncStatus.IMPORTED.value:
                    from ..models.user_game import UserGame
                    from ..models.game import Game as GameModel
                    
                    # Find the game in our DB
                    game_record = self.db.query(GameModel).filter(
                        GameModel.igdb_id == existing.igdb_id
                    ).first()
                    
                    if game_record:
                        # Check if still in user's library
                        in_library = self.db.query(UserGame).filter(
                            UserGame.user_id == user_id,
                            UserGame.game_id == game_record.id
                        ).first()
                        
                        if not in_library:
                            # Reset to pending since no longer in library
                            existing.status = SyncStatus.PENDING.value
                
                stats["updated"] += 1
            else:
                # Match to IGDB
                platform_name_raw = game.get("name", "")
                first_played = game.get("first_played")
                igdb_id, igdb_name, igdb_cover, confidence, method = self._match_game(
                    platform_id=platform_id,
                    platform_name=platform_name_raw,
                    platform="psn",
                    first_played=first_played
                )
                
                # Create new synced game
                # Routing to Ready vs Review is handled by frontend based on name comparison
                synced = SyncedGame(
                    user_id=user_id,
                    platform="psn",
                    platform_id=platform_id,
                    platform_name=platform_name_raw,
                    igdb_id=igdb_id,
                    igdb_name=igdb_name,
                    igdb_cover_url=igdb_cover,
                    match_confidence=confidence,
                    match_method=method,
                    status=SyncStatus.PENDING.value,
                    playtime_minutes=game.get("playtime_minutes"),
                    image_url=game.get("image_url"),
                    last_synced_at=datetime.utcnow(),
                    created_at=datetime.utcnow()
                )
                self.db.add(synced)
                stats["new"] += 1
        
        self.db.commit()
        return stats
    
    def _match_game(self, platform_id: str, platform_name: str, platform: str, 
                    first_played: datetime = None) -> tuple:
        """
        Match a platform game to IGDB with multiple fallback strategies.
        
        Args:
            platform_id: Platform-specific game ID
            platform_name: Game name from platform
            platform: 'psn' or 'steam'
            first_played: When user first played (for release date disambiguation)
        
        Returns:
            (igdb_id, igdb_name, igdb_cover, confidence, method) - any can be None
        """
        # Step 1: For PSN, look up official name from Sony database
        if platform == "psn":
            lookup = self.db.query(PsnTitleLookup).filter(
                PsnTitleLookup.title_id == platform_id
            ).first()
            
            if lookup:
                clean_name = self._clean_name(lookup.name)
                
                # Try exact match first
                game = self.db.query(Game).filter(Game.name == clean_name).first()
                if game:
                    return (game.igdb_id, game.name, game.cover_image, 0.99, "exact")
                
                # Try case-insensitive exact
                game = self.db.query(Game).filter(Game.name.ilike(clean_name)).first()
                if game:
                    return (game.igdb_id, game.name, game.cover_image, 0.95, "iexact")
                
                # Use Sony name for slug matching
                platform_name = clean_name
        
        # Step 2: Slug matching with fallbacks
        slug = self._generate_slug(platform_name)
        
        # Check base slug and IGDB disambiguation suffixes (--1, --2, etc.)
        candidates = self.db.query(Game).filter(
            (Game.slug == slug) | 
            (Game.slug.like(f"{slug}--_"))  # Match --1, --2, etc.
        ).all()
        
        if candidates:
            game = self._pick_best_match(candidates, first_played)
            if game:
                confidence = 0.85 if game.slug == slug else 0.80
                return (game.igdb_id, game.name, game.cover_image, confidence, "slug")
        
        # 2b. Try with Roman numeral conversion (3→iii, 2→ii)
        roman_slug = self._slug_with_roman_numerals(slug)
        if roman_slug != slug:
            candidates = self.db.query(Game).filter(
                (Game.slug == roman_slug) | 
                (Game.slug.like(f"{roman_slug}--_"))
            ).all()
            
            if candidates:
                game = self._pick_best_match(candidates, first_played)
                if game:
                    return (game.igdb_id, game.name, game.cover_image, 0.80, "slug_roman")
        
        # Step 3: Partial name search (last resort - be careful with short names)
        clean_name = self._clean_name(platform_name)
        if len(clean_name) >= 5:  # Only for names 5+ chars to avoid false positives
            # Use word boundary matching - name should be at start or have clear boundaries
            game = self.db.query(Game).filter(
                Game.name.ilike(f"{clean_name}%")  # Starts with
            ).first()
            if game:
                return (game.igdb_id, game.name, game.cover_image, 0.60, "partial")
        
        # Step 4: No match found
        return (None, None, None, None, None)
    
    def _pick_best_match(self, candidates: list, first_played: datetime = None) -> Game:
        """
        Pick the best match from multiple candidate games.
        Uses release date to disambiguate (e.g., 2015 Star Wars Battlefront vs 2004).
        
        Logic: Prefer the game with the most recent release date that is
        still BEFORE or within a few months AFTER when the user first played.
        """
        if len(candidates) == 1:
            return candidates[0]
        
        if not first_played:
            # No first_played info - prefer newer game (higher IGDB ID = newer entry)
            return max(candidates, key=lambda g: g.igdb_id or 0)
        
        from datetime import timedelta
        
        # Make first_played timezone-naive for comparison with IGDB dates
        if hasattr(first_played, 'tzinfo') and first_played.tzinfo is not None:
            first_played = first_played.replace(tzinfo=None)
        
        # Allow games released up to ~2 months after first_played (pre-release access, etc.)
        cutoff = first_played + timedelta(days=60)
        
        # Filter to games released before or shortly after first_played
        valid = [g for g in candidates 
                 if g.first_release_date and g.first_release_date <= cutoff]
        
        if valid:
            # Pick the most recently released valid game
            return max(valid, key=lambda g: g.first_release_date)
        
        # No valid matches by date - fall back to newest by IGDB ID
        return max(candidates, key=lambda g: g.igdb_id or 0)
    
    # Slug numeral conversion (IGDB often uses Roman numerals)
    _ARABIC_TO_ROMAN = {
        '10': 'x', '9': 'ix', '8': 'viii', '7': 'vii', '6': 'vi',
        '5': 'v', '4': 'iv', '3': 'iii', '2': 'ii', '1': 'i',
    }
    
    def _slug_with_roman_numerals(self, slug: str) -> str:
        """Convert trailing Arabic numeral in slug to Roman numeral."""
        for arabic, roman in self._ARABIC_TO_ROMAN.items():
            # Match number at end of slug (e.g., "-3" → "-iii")
            if slug.endswith(f'-{arabic}'):
                return slug[:-len(arabic)-1] + f'-{roman}'
        return slug
    
    def _normalize_unicode(self, text: str) -> str:
        """Normalize Unicode chars (ö→o, é→e) using NFD decomposition."""
        normalized = unicodedata.normalize('NFD', text)
        return ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
    
    def _clean_name(self, name: str) -> str:
        """Remove trademark symbols, normalize Unicode, and spacing."""
        # Unicode Roman numerals → ASCII equivalents
        roman_map = {
            'Ⅰ': 'I', 'Ⅱ': 'II', 'Ⅲ': 'III', 'Ⅳ': 'IV', 'Ⅴ': 'V',
            'Ⅵ': 'VI', 'Ⅶ': 'VII', 'Ⅷ': 'VIII', 'Ⅸ': 'IX', 'Ⅹ': 'X',
            'Ⅺ': 'XI', 'Ⅻ': 'XII',
            # Lowercase variants
            'ⅰ': 'I', 'ⅱ': 'II', 'ⅲ': 'III', 'ⅳ': 'IV', 'ⅴ': 'V',
            'ⅵ': 'VI', 'ⅶ': 'VII', 'ⅷ': 'VIII', 'ⅸ': 'IX', 'ⅹ': 'X',
            'ⅺ': 'XI', 'ⅻ': 'XII',
        }
        for unicode_char, ascii_equiv in roman_map.items():
            if unicode_char in name:
                # Insert space before numeral if preceded by a letter (SOULCALIBURⅥ → SOULCALIBUR VI)
                name = re.sub(rf'([a-zA-Z])({re.escape(unicode_char)})', rf'\1 {ascii_equiv}', name)
                name = name.replace(unicode_char, ascii_equiv)
        
        return (name
            .replace("™", "")
            .replace("®", "")
            .replace("©", "")
            .strip())
    
    def _generate_slug(self, name: str) -> str:
        """Generate IGDB-compatible slug from game name."""
        name = self._clean_name(name)
        name = self._normalize_unicode(name)
        
        slug = name.lower()
        slug = slug.replace('_', ' ')
        slug = re.sub(r"[^a-z0-9\s-]", "", slug)
        slug = re.sub(r"\s+", "-", slug)
        slug = re.sub(r"-+", "-", slug)
        return slug.strip("-")
    
    def get_synced_games(self, user_id: int, platform: str = None, status: str = None) -> list:
        """
        Get synced games for a user with optional filters.
        Also verifies that 'imported' games are still in the user's library.
        """
        from ..models.user_game import UserGame
        
        query = self.db.query(SyncedGame).filter(SyncedGame.user_id == user_id)
        
        if platform:
            query = query.filter(SyncedGame.platform == platform)
        if status:
            query = query.filter(SyncedGame.status == status)
        
        games = query.order_by(SyncedGame.platform_name).all()
        
        # Verify imported games are still in library
        # If user removed a game from library, reset to pending
        games_to_reset = []
        for game in games:
            if game.status == SyncStatus.IMPORTED.value and game.igdb_id:
                # Find game in our DB
                db_game = self.db.query(Game).filter(
                    Game.igdb_id == game.igdb_id
                ).first()
                
                if db_game:
                    # Check if still in user's library
                    in_library = self.db.query(UserGame).filter(
                        UserGame.user_id == user_id,
                        UserGame.game_id == db_game.id
                    ).first()
                    
                    if not in_library:
                        # Game removed from library - reset to ready
                        game.status = SyncStatus.PENDING.value
                        games_to_reset.append(game.platform_name)
        
        # Commit any status resets
        if games_to_reset:
            self.db.commit()
        
        return games
    
    def update_game_status(self, game_id: int, user_id: int, **kwargs) -> Optional[SyncedGame]:
        """Update synced game status, target list, or fix wrong match."""
        game = self.db.query(SyncedGame).filter(
            SyncedGame.id == game_id,
            SyncedGame.user_id == user_id
        ).first()
        
        if not game:
            return None
        
        # Update allowed fields
        if "status" in kwargs:
            game.status = kwargs["status"]
        if "target_list" in kwargs:
            game.target_list = kwargs["target_list"]
        if "igdb_id" in kwargs:
            # User is fixing wrong match
            new_igdb = self.db.query(Game).filter(Game.igdb_id == kwargs["igdb_id"]).first()
            if new_igdb:
                game.igdb_id = new_igdb.igdb_id
                game.igdb_name = new_igdb.name
                game.match_confidence = 1.0
                game.match_method = "manual"
        
        self.db.commit()
        return game
