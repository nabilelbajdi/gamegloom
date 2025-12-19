# services/psn_service.py
"""
PlayStation Network integration service.

Handles:
- PSN API access via psnawp library
- Game name cleaning and normalization
- IGDB matching logic
- Account linking/unlinking
"""
import re
import logging
import unicodedata
from datetime import datetime, timezone
from typing import Optional
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy.orm import Session

from ...settings import settings
from ..models.user_platform_link import UserPlatformLink, PlatformType
from ..models.game import Game
from ..models.psn_title_lookup import PsnTitleLookup

logger = logging.getLogger(__name__)


class PSNServiceError(Exception):
    """Custom exception for PSN service errors."""
    pass


# ═══════════════════════════════════════════════════════════════════
# Non-Game Blocklist - apps/media/demos to filter out during sync
# ═══════════════════════════════════════════════════════════════════

NON_GAME_TITLES = {
    # Media apps
    "spotify", "netflix", "youtube", "amazon prime video", "hulu", "disney+",
    "apple tv", "crunchyroll", "plex", "twitch", "hbo max", "peacock",
    "paramount+", "amazon video", "vudu", "vidzone", "vrideo", "vrideo vr",
    # Utilities & companions
    "headset companion", "playstation app", "remote play", "share factory",
    "media player", "playstation vue", "ps vue", "share factory studio",
    "sharefactory",
    # News/info apps
    "ign", "gamespot", "polygon",
    # Browser/social
    "web browser", "internet browser",
}

NON_GAME_PATTERNS = [
    r"demo disc",
    r"playstation\s*vr demo",
    r"^\s*demo\s*$",
    r"trial version",
    r"beta\s+(app|version|client)$",
    r"companion app",
    r"theme\s*(pack)?$",
    r"avatar\s*(pack)?$",
]

_NON_GAME_PATTERNS = [re.compile(p, re.IGNORECASE) for p in NON_GAME_PATTERNS]


def is_non_game(title: str) -> bool:
    """Check if a title is a known non-game (app/media/demo)."""
    if not title:
        return False
    
    title_lower = title.lower().strip()
    
    if title_lower in NON_GAME_TITLES:
        return True
    
    for pattern in _NON_GAME_PATTERNS:
        if pattern.search(title):
            return True
    
    return False


# ═══════════════════════════════════════════════════════════════════
# PSNAWP Client
# ═══════════════════════════════════════════════════════════════════

def _get_psnawp_client():
    """
    Get a PSNAWP client using the server-side NPSSO token.
    
    Returns:
        PSNAWP instance
        
    Raises:
        PSNServiceError: If PSN_NPSSO is not configured or invalid
    """
    from psnawp_api import PSNAWP
    
    npsso = settings.PSN_NPSSO
    if not npsso:
        raise PSNServiceError("PSN_NPSSO not configured in environment variables")
    
    try:
        return PSNAWP(npsso)
    except Exception as e:
        raise PSNServiceError(f"Failed to initialize PSN client: {e}")


def check_psn_health() -> dict:
    """
    Check if PSN integration is healthy (NPSSO token valid).
    
    Returns:
        {"status": "ok"} or {"status": "error", "message": "..."}
    """
    try:
        client = _get_psnawp_client()
        # Try to get client's own account to verify token
        client.me()
        return {"status": "ok"}
    except PSNServiceError as e:
        return {"status": "error", "message": str(e)}
    except Exception as e:
        return {"status": "error", "message": f"PSN API error: {e}"}


# ═══════════════════════════════════════════════════════════════════
# Name Cleaning & Normalization
# ═══════════════════════════════════════════════════════════════════

def _normalize_unicode(text: str) -> str:
    """Normalize Unicode chars (ö→o, é→e) using NFD decomposition."""
    normalized = unicodedata.normalize('NFD', text)
    return ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')


def _clean_name(name: str) -> str:
    """
    Clean a game name for matching:
    - Remove trademark symbols (™®©)
    - Convert Unicode Roman numerals
    - Fix spacing around numbers
    - Normalize Unicode
    """
    # Unicode Roman numerals → ASCII equivalents
    roman_map = {
        'Ⅰ': 'I', 'Ⅱ': 'II', 'Ⅲ': 'III', 'Ⅳ': 'IV', 'Ⅴ': 'V',
        'Ⅵ': 'VI', 'Ⅶ': 'VII', 'Ⅷ': 'VIII', 'Ⅸ': 'IX', 'Ⅹ': 'X',
        'Ⅺ': 'XI', 'Ⅻ': 'XII',
        'ⅰ': 'I', 'ⅱ': 'II', 'ⅲ': 'III', 'ⅳ': 'IV', 'ⅴ': 'V',
        'ⅵ': 'VI', 'ⅶ': 'VII', 'ⅷ': 'VIII', 'ⅸ': 'IX', 'ⅹ': 'X',
        'ⅺ': 'XI', 'ⅻ': 'XII',
    }
    
    for unicode_char, ascii_equiv in roman_map.items():
        if unicode_char in name:
            name = re.sub(rf'([a-zA-Z])({re.escape(unicode_char)})', rf'\1 {ascii_equiv}', name)
            name = name.replace(unicode_char, ascii_equiv)
    
    # Remove trademark symbols
    name = name.replace("™", "").replace("®", "").replace("©", "")
    
    # Fix spacing around numbers (LittleBigPlanet3 → LittleBigPlanet 3)
    name = re.sub(r'([a-zA-Z])(\d)', r'\1 \2', name)
    
    return name.strip()


def _clean_psn_name(name: str) -> str:
    """
    Clean a PSN game name for display and matching:
    - Removes season/edition suffixes
    - Removes trademark symbols
    - Fixes common franchise naming issues
    """
    if not name:
        return ""
    
    # Remove season/edition suffixes like "– Season 20: Vendetta"
    if " – " in name:
        name = name.split(" – ")[0]
    if " - " in name:
        parts = name.split(" - ")
        if len(parts) == 2 and any(word in parts[1].lower() for word in ['season', 'update', 'edition', 'version']):
            name = parts[0]
    
    name = _clean_name(name)
    
    # Fix common franchise naming (add colons where IGDB expects them)
    franchise_fixes = {
        'Call of Duty Ghosts': 'Call of Duty: Ghosts',
        'Call of Duty Black Ops': 'Call of Duty: Black Ops',
        'Call of Duty Modern Warfare': 'Call of Duty: Modern Warfare',
        'Divinity : Original Sin': 'Divinity: Original Sin',
    }
    for wrong, correct in franchise_fixes.items():
        if wrong in name:
            name = name.replace(wrong, correct)
    
    # Fix spacing around colons
    name = re.sub(r'\s*:\s*', ': ', name)
    
    # Clean up extra whitespace
    return " ".join(name.split()).strip()


def _generate_slug(name: str) -> str:
    """Generate IGDB-compatible slug from game name."""
    name = _clean_name(name)
    name = _normalize_unicode(name)
    
    slug = name.lower()
    slug = slug.replace('_', ' ')
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


# Arabic to Roman numeral mapping for slug conversion
_ARABIC_TO_ROMAN = {
    '10': 'x', '9': 'ix', '8': 'viii', '7': 'vii', '6': 'vi',
    '5': 'v', '4': 'iv', '3': 'iii', '2': 'ii', '1': 'i',
}


def _slug_with_roman_numerals(slug: str) -> str:
    """Convert trailing Arabic numeral in slug to Roman numeral."""
    for arabic, roman in _ARABIC_TO_ROMAN.items():
        if slug.endswith(f'-{arabic}'):
            return slug[:-len(arabic)-1] + f'-{roman}'
    return slug


# ═══════════════════════════════════════════════════════════════════
# IGDB Matching
# ═══════════════════════════════════════════════════════════════════

def _pick_best_match(candidates: list, first_played: datetime = None) -> Game:
    """
    Pick the best match from multiple candidate games.
    Uses release date to disambiguate (e.g., 2015 Star Wars Battlefront vs 2004).
    """
    if len(candidates) == 1:
        return candidates[0]
    
    if not first_played:
        # No first_played info - prefer newer game
        return max(candidates, key=lambda g: g.igdb_id or 0)
    
    from datetime import timedelta
    
    # Make first_played timezone-naive for comparison
    if hasattr(first_played, 'tzinfo') and first_played.tzinfo is not None:
        first_played = first_played.replace(tzinfo=None)
    
    # Allow games released up to ~2 months after first_played
    cutoff = first_played + timedelta(days=60)
    
    valid = [g for g in candidates 
             if g.first_release_date and g.first_release_date <= cutoff]
    
    if valid:
        return max(valid, key=lambda g: g.first_release_date)
    
    return max(candidates, key=lambda g: g.igdb_id or 0)


def match_game_to_igdb(
    db: Session,
    platform_id: str,
    platform_name: str,
    first_played: datetime = None
) -> tuple:
    """
    Match a PSN game to IGDB.
    
    Matching strategy:
    1. Sony title lookup table → exact name match
    2. Slug match with IGDB disambiguation suffixes
    3. Roman numeral conversion (3→iii)
    4. Partial name prefix match
    
    Args:
        db: Database session
        platform_id: PSN title_id (e.g., "CUSA00634_00")
        platform_name: Cleaned game name from PSN
        first_played: When user first played (for disambiguation)
    
    Returns:
        (igdb_id, igdb_name, cover_url, confidence, method) - any can be None
    """
    # Step 1: Sony title lookup table
    lookup = db.query(PsnTitleLookup).filter(
        PsnTitleLookup.title_id == platform_id
    ).first()
    
    if lookup:
        clean_name = _clean_name(lookup.name)
        
        # Exact match
        game = db.query(Game).filter(Game.name == clean_name).first()
        if game:
            logger.debug(f"[Match] {platform_name} → {game.name} (exact)")
            return (game.igdb_id, game.name, game.cover_image, 0.99, "exact")
        
        # Case-insensitive exact
        game = db.query(Game).filter(Game.name.ilike(clean_name)).first()
        if game:
            logger.debug(f"[Match] {platform_name} → {game.name} (iexact)")
            return (game.igdb_id, game.name, game.cover_image, 0.95, "iexact")
        
        # Use Sony lookup name for slug matching
        platform_name = clean_name
    
    # Step 2: Slug matching
    slug = _generate_slug(platform_name)
    
    candidates = db.query(Game).filter(
        (Game.slug == slug) | 
        (Game.slug.like(f"{slug}--_"))  # Match --1, --2, etc.
    ).all()
    
    if candidates:
        game = _pick_best_match(candidates, first_played)
        if game:
            confidence = 0.85 if game.slug == slug else 0.80
            logger.debug(f"[Match] {platform_name} → {game.name} (slug)")
            return (game.igdb_id, game.name, game.cover_image, confidence, "slug")
    
    # Step 3: Roman numeral conversion
    roman_slug = _slug_with_roman_numerals(slug)
    if roman_slug != slug:
        candidates = db.query(Game).filter(
            (Game.slug == roman_slug) | 
            (Game.slug.like(f"{roman_slug}--_"))
        ).all()
        
        if candidates:
            game = _pick_best_match(candidates, first_played)
            if game:
                logger.debug(f"[Match] {platform_name} → {game.name} (slug_roman)")
                return (game.igdb_id, game.name, game.cover_image, 0.80, "slug_roman")
    
    # Step 4: Partial name search (prefix match, min 5 chars)
    clean_name = _clean_name(platform_name)
    if len(clean_name) >= 5:
        # Get all matching games, ordered by igdb_id (lower = original, not localized version)
        candidates = db.query(Game).filter(
            Game.name.ilike(f"{clean_name}%")
        ).order_by(Game.igdb_id).limit(5).all()
        
        if candidates:
            game = candidates[0]  # Take lowest igdb_id (usually the original/English version)
            logger.debug(f"[Match] {platform_name} → {game.name} (partial)")
            return (game.igdb_id, game.name, game.cover_image, 0.60, "partial")
    
    # Step 5: No match
    logger.debug(f"[Match] {platform_name} → UNMATCHED")
    return (None, None, None, None, None)


# ═══════════════════════════════════════════════════════════════════
# PSN Game Fetching
# ═══════════════════════════════════════════════════════════════════

def get_psn_games(username: str) -> list[dict]:
    """
    Get all games for a PSN user by their username.
    
    Uses title_stats which provides playtime data.
    Aggregates PS4/PS5 versions of the same game.
    Filters out non-game apps.
    
    Args:
        username: PSN online_id
        
    Returns:
        List of games with title_id, name, playtime, etc.
        
    Raises:
        PSNServiceError: If user not found or profile is private
    """
    try:
        psnawp = _get_psnawp_client()
        
        try:
            user = psnawp.user(online_id=username)
        except Exception as e:
            if "not found" in str(e).lower():
                raise PSNServiceError(f"PSN user '{username}' not found")
            raise PSNServiceError(f"Failed to find PSN user: {e}")
        
        # First, collect all games from title_stats
        raw_games = []
        try:
            for stat in user.title_stats(limit=None):
                raw_name = stat.name or ""
                
                # Skip non-game apps early
                if is_non_game(_clean_psn_name(raw_name)):
                    continue
                
                play_mins = 0
                if stat.play_duration:
                    play_mins = int(stat.play_duration.total_seconds() / 60)
                
                raw_games.append({
                    "title_id": stat.title_id,
                    "raw_name": raw_name,
                    "image_url": stat.image_url,
                    "play_duration_minutes": play_mins,
                    "play_count": stat.play_count or 0,
                    "last_played": stat.last_played_date_time,
                    "first_played": stat.first_played_date_time,
                })
        except Exception as e:
            if "forbidden" in str(e).lower() or "private" in str(e).lower():
                raise PSNServiceError(
                    f"User '{username}' has a private profile. "
                    "They must set their PSN privacy to public."
                )
            raise PSNServiceError(f"Failed to fetch games: {e}")
        
        # Static mapping for known games where PSN name doesn't match the actual game
        # This happens when games are "upgraded" (e.g., OW1 became OW2 on PSN)
        # Keys are title_ids from PSN, values are the correct game names
        TITLE_ID_OVERRIDE = {
            # Overwatch 1 (original) - PSN shows as "Overwatch 2" but these are OW1 title_ids
            "CUSA03974_00": "Overwatch",  # PS4 Overwatch 1
            "CUSA04961_00": "Overwatch",  # PS4 Overwatch 1 (alternate region?)
            # Note: PPSA07821_00, PPSA08257_00, CUSA34317_00 are actual OW2 title_ids
        }
        
        logger.info(f"[PSN] Using static override map for {len(TITLE_ID_OVERRIDE)} known games")
        
        # Build final games list using override names where available
        games = []
        for game in raw_games:
            title_id = game["title_id"]
            raw_name = game["raw_name"]
            
            # Use static override if available, otherwise use current name
            if title_id in TITLE_ID_OVERRIDE:
                name = TITLE_ID_OVERRIDE[title_id]
            else:
                name = _clean_psn_name(raw_name)
            
            games.append({
                "title_id": title_id,
                "name": name,
                "image_url": game["image_url"],
                "play_duration_minutes": game["play_duration_minutes"],
                "play_count": game["play_count"],
                "last_played": game["last_played"],
                "first_played": game["first_played"],
            })
        
        # Return all games individually - aggregation will happen in sync service
        # after IGDB matching (so we combine by IGDB ID, not by name)
        logger.info(f"[PSN] Fetched {len(games)} games for user '{username}'")
        return games
        
    except PSNServiceError:
        raise
    except Exception as e:
        raise PSNServiceError(f"Failed to get PSN games: {e}")


# ═══════════════════════════════════════════════════════════════════
# Account Linking
# ═══════════════════════════════════════════════════════════════════

def verify_psn_username(username: str) -> dict:
    """
    Verify a PSN username exists and is accessible.
    
    Returns:
        {"online_id": str, "account_id": str}
        
    Raises:
        PSNServiceError: If user not found
    """
    try:
        psnawp = _get_psnawp_client()
        user = psnawp.user(online_id=username)
        
        return {
            "online_id": user.online_id,
            "account_id": str(user.account_id),
        }
    except Exception as e:
        if "not found" in str(e).lower():
            raise PSNServiceError(f"PSN user '{username}' not found")
        raise PSNServiceError(f"Failed to verify PSN user: {e}")


def link_psn_account(db: Session, user_id: int, username: str) -> UserPlatformLink:
    """
    Link a PSN account to a GameGloom user.
    
    Args:
        db: Database session
        user_id: GameGloom user ID
        username: PSN online_id
        
    Returns:
        Created or updated UserPlatformLink
    """
    profile = verify_psn_username(username)
    
    existing = db.query(UserPlatformLink).filter(
        UserPlatformLink.user_id == user_id,
        UserPlatformLink.platform == PlatformType.PSN.value
    ).first()
    
    if existing:
        existing.platform_user_id = profile["account_id"]
        existing.platform_username = profile["online_id"]
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        logger.info(f"[PSN] Updated link for user {user_id}: {username}")
        return existing
    
    link = UserPlatformLink(
        user_id=user_id,
        platform=PlatformType.PSN.value,
        platform_user_id=profile["account_id"],
        platform_username=profile["online_id"],
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    logger.info(f"[PSN] Created link for user {user_id}: {username}")
    return link


def unlink_psn_account(db: Session, user_id: int) -> bool:
    """
    Unlink PSN account from a GameGloom user.
    
    Returns:
        True if unlinked, False if no link existed
    """
    link = db.query(UserPlatformLink).filter(
        UserPlatformLink.user_id == user_id,
        UserPlatformLink.platform == PlatformType.PSN.value
    ).first()
    
    if link:
        db.delete(link)
        db.commit()
        logger.info(f"[PSN] Unlinked account for user {user_id}")
        return True
    return False


def get_psn_link(db: Session, user_id: int) -> Optional[UserPlatformLink]:
    """Get the PSN link for a user, if it exists."""
    return db.query(UserPlatformLink).filter(
        UserPlatformLink.user_id == user_id,
        UserPlatformLink.platform == PlatformType.PSN.value
    ).first()


def update_last_synced(db: Session, user_id: int) -> None:
    """Update the last_synced_at timestamp for a user's PSN link."""
    link = get_psn_link(db, user_id)
    if link:
        link.last_synced_at = datetime.now(timezone.utc)
        db.commit()


# ═══════════════════════════════════════════════════════════════════
# PSN Profile (Avatar)
# ═══════════════════════════════════════════════════════════════════

def get_psn_profile(username: str) -> dict:
    """
    Get PSN profile data including avatar URL and trophy stats.
    
    Args:
        username: PSN online_id
        
    Returns:
        {
            "online_id": str, 
            "account_id": str, 
            "avatar_url": str|None,
            "trophy_level": int|None,
            "platinum": int, "gold": int, "silver": int, "bronze": int
        }
    """
    try:
        psnawp = _get_psnawp_client()
        user = psnawp.user(online_id=username)
        
        # Try to get avatar URL from profile
        avatar_url = None
        try:
            profile = user.profile()
            # profile() returns "avatars" list with "size" and "url" keys
            avatars = profile.get("avatars", [])
            if avatars:
                # Prefer xl (extra large), then l (large)
                for preferred_size in ["xl", "l", "m", "s"]:
                    for av in avatars:
                        if av.get("size") == preferred_size and av.get("url"):
                            avatar_url = av["url"]
                            break
                    if avatar_url:
                        break
        except Exception as e:
            logger.warning(f"[PSN] Could not fetch avatar for {username}: {e}")
        
        # Try to get trophy stats
        trophy_level = None
        platinum = gold = silver = bronze = 0
        try:
            trophy_summary = user.trophy_summary()
            trophy_level = trophy_summary.trophy_level
            platinum = trophy_summary.earned_trophies.platinum or 0
            gold = trophy_summary.earned_trophies.gold or 0
            silver = trophy_summary.earned_trophies.silver or 0
            bronze = trophy_summary.earned_trophies.bronze or 0
        except Exception as e:
            logger.warning(f"[PSN] Could not fetch trophies for {username}: {e}")
        
        return {
            "online_id": user.online_id,
            "account_id": str(user.account_id),
            "avatar_url": avatar_url,
            "trophy_level": trophy_level,
            "platinum": platinum,
            "gold": gold,
            "silver": silver,
            "bronze": bronze,
        }
    except Exception as e:
        logger.warning(f"[PSN] Could not fetch profile for {username}: {e}")
        return {
            "online_id": username,
            "account_id": None,
            "avatar_url": None,
            "trophy_level": None,
            "platinum": 0,
            "gold": 0,
            "silver": 0,
            "bronze": 0,
        }
