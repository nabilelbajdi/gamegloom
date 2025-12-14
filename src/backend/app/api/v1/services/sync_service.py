# services/sync_service.py
"""
Sync Service - handles syncing games from PSN/Steam.

Simplified matching:
1. Exact name match (from Sony 65k database)
2. Slug match (fallback)
3. Mark as unmatched (user can fix)
"""
import re
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
                igdb_id, igdb_name, igdb_cover, confidence, method = self._match_game(
                    platform_id=platform_id,
                    platform_name=platform_name_raw,
                    platform="psn"
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
    
    def _match_game(self, platform_id: str, platform_name: str, platform: str) -> tuple:
        """
        Match a platform game to IGDB. Simplified logic.
        
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
        
        # Step 2: Slug matching
        slug = self._generate_slug(platform_name)
        game = self.db.query(Game).filter(Game.slug == slug).first()
        if game:
            return (game.igdb_id, game.name, game.cover_image, 0.85, "slug")
        
        # Step 3: No match found
        return (None, None, None, None, None)
    
    def _clean_name(self, name: str) -> str:
        """Remove trademark symbols, normalize spacing."""
        return (name
            .replace("™", "")
            .replace("®", "")
            .replace("©", "")
            .strip())
    
    def _generate_slug(self, name: str) -> str:
        """Generate IGDB-compatible slug from game name."""
        slug = name.lower()
        slug = slug.replace("™", "").replace("®", "").replace("©", "")
        slug = re.sub(r"[^a-z0-9\s-]", "", slug)
        slug = re.sub(r"[\s_]+", "-", slug)
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
