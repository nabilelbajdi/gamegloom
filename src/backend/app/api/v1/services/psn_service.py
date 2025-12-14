# services/psn_service.py
"""
PlayStation Network integration service.
Uses psnawp library for PSN API access.
"""
import re
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from ...settings import settings
from ..models.user_platform_link import UserPlatformLink, PlatformType


class PSNServiceError(Exception):
    """Custom exception for PSN service errors."""
    pass


def _get_psnawp_client():
    """
    Get a PSNAWP client using the server-side NPSSO token.
    
    Returns:
        PSNAWP instance
        
    Raises:
        PSNServiceError: If PSN_NPSSO is not configured
    """
    from psnawp_api import PSNAWP
    
    npsso = settings.PSN_NPSSO
    if not npsso:
        raise PSNServiceError("PSN_NPSSO not configured in environment variables")
    
    try:
        return PSNAWP(npsso)
    except Exception as e:
        raise PSNServiceError(f"Failed to initialize PSN client: {e}")


def get_games_by_username(username: str) -> list[dict]:
    """
    Get all games for a PSN user by their username (online_id).
    
    Uses title_stats which provides playtime data.
    Requires the user's PSN profile to be public.
    
    Args:
        username: PSN online_id (username)
        
    Returns:
        List of games with title, playtime, and play count
        
    Raises:
        PSNServiceError: If user not found or profile is private
    """
    try:
        psnawp = _get_psnawp_client()
        
        # Look up user by username
        try:
            user = psnawp.user(online_id=username)
        except Exception as e:
            if "not found" in str(e).lower():
                raise PSNServiceError(f"PSN user '{username}' not found")
            raise PSNServiceError(f"Failed to find PSN user: {e}")
        
        # Get games from title_stats (includes playtime!)
        games = []
        try:
            for stat in user.title_stats(limit=None):
                # Clean up game name for better IGDB matching
                name = stat.name or ""
                
                # Remove season/edition suffixes like "– Season 20: Vendetta"
                if " – " in name:
                    name = name.split(" – ")[0]
                if " - " in name:
                    # Check if it's a season/update suffix
                    parts = name.split(" - ")
                    if len(parts) == 2 and any(word in parts[1].lower() for word in ['season', 'update', 'edition', 'version']):
                        name = parts[0]
                
                # Remove trademark/registered symbols
                name = name.replace("™", "").replace("®", "").replace("©", "")
                
                # Fix spacing around numbers (LittleBigPlanet3 → LittleBigPlanet 3)
                name = re.sub(r'([a-zA-Z])(\d)', r'\1 \2', name)
                
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
                
                # Fix spacing around colons (remove extra spaces)
                name = re.sub(r'\s*:\s*', ': ', name)
                
                # Clean up extra whitespace
                name = " ".join(name.split()).strip()
                
                # Skip non-game apps
                non_games = [
                    'Netflix', 'YouTube', 'Spotify', 'Twitch', 'Disney+', 'Hulu', 
                    'Prime Video', 'HBO Max', 'Crunchyroll', 'Share Factory Studio',
                    'ShareFactory', 'Media Player', 'PlayStation Now', 'PlayStation Plus',
                    'Plex', 'Apple TV', 'Paramount+', 'Peacock'
                ]
                if any(app.lower() in name.lower() for app in non_games):
                    continue
                
                # Get playtime in minutes
                play_mins = 0
                if stat.play_duration:
                    play_mins = int(stat.play_duration.total_seconds() / 60)
                
                games.append({
                    "title_id": stat.title_id,
                    "name": name,
                    "image_url": stat.image_url,
                    "play_duration_minutes": play_mins,
                    "play_count": stat.play_count or 0,
                    "last_played": stat.last_played_date_time,
                    "first_played": stat.first_played_date_time,
                })
        except Exception as e:
            if "forbidden" in str(e).lower() or "private" in str(e).lower():
                raise PSNServiceError(f"User '{username}' has a private profile. They must set their PSN privacy to public.")
            raise PSNServiceError(f"Failed to fetch games: {e}")
        
        # Aggregate duplicates (PS4/PS5 versions) by game name
        aggregated = {}
        for game in games:
            name = game["name"]
            if name in aggregated:
                # Sum playtime and play count
                aggregated[name]["play_duration_minutes"] += game["play_duration_minutes"]
                aggregated[name]["play_count"] += game["play_count"]
                # Keep the most recent last_played and earliest first_played
                if game["last_played"] and (not aggregated[name]["last_played"] or game["last_played"] > aggregated[name]["last_played"]):
                    aggregated[name]["last_played"] = game["last_played"]
                if game["first_played"] and (not aggregated[name]["first_played"] or game["first_played"] < aggregated[name]["first_played"]):
                    aggregated[name]["first_played"] = game["first_played"]
                # Keep the image from the entry with more playtime
                if game["play_duration_minutes"] > aggregated[name].get("_max_playtime", 0):
                    aggregated[name]["image_url"] = game["image_url"]
                    aggregated[name]["title_id"] = game["title_id"]
                    aggregated[name]["_max_playtime"] = game["play_duration_minutes"]
            else:
                aggregated[name] = game.copy()
                aggregated[name]["_max_playtime"] = game["play_duration_minutes"]
        
        # Remove internal tracking field and return list
        result = list(aggregated.values())
        for g in result:
            g.pop("_max_playtime", None)
        
        return result
    except PSNServiceError:
        raise
    except Exception as e:
        raise PSNServiceError(f"Failed to get PSN games: {e}")


def get_games_with_trophy_ids(username: str) -> list[dict]:
    """
    Get all games with both trophy IDs (NPWR) and playtime data.
    
    Combines trophy_titles (for NPWR IDs needed for mapping) with
    title_stats (for playtime data).
    
    Args:
        username: PSN online_id (username)
        
    Returns:
        List of games with trophy_id (NPWR), name, playtime, etc.
    """
    try:
        psnawp = _get_psnawp_client()
        
        try:
            user = psnawp.user(online_id=username)
        except Exception as e:
            if "not found" in str(e).lower():
                raise PSNServiceError(f"PSN user '{username}' not found")
            raise PSNServiceError(f"Failed to find PSN user: {e}")
        
        # **PARALLEL FETCH** - Fetch trophy titles and stats simultaneously
        from concurrent.futures import ThreadPoolExecutor
        
        def fetch_trophy_titles():
            """Fetch trophy titles in separate thread"""
            titles = []
            for trophy in user.trophy_titles(limit=None):
                titles.append(trophy)
            return titles
        
        def fetch_title_stats():
            """Fetch title stats in separate thread"""
            stats = []
            for stat in user.title_stats(limit=None):
                stats.append(stat)
            return stats
        
        # Execute both API calls in parallel (cuts time in half!)
        with ThreadPoolExecutor(max_workers=2) as executor:
            trophy_future = executor.submit(fetch_trophy_titles)
            stats_future = executor.submit(fetch_title_stats)
            
            trophy_titles = trophy_future.result()
            title_stats = stats_future.result()
        
        # Process trophy titles for NPWR IDs
        trophy_data = {}
        try:
            for trophy in trophy_titles:
                name = trophy.title_name or ""
                # Clean the name
                name = name.replace("™", "").replace("®", "").replace("©", "")
                name = " ".join(name.split()).strip()
                
                # Store by normalized name for matching
                normalized = name.lower()
                if normalized not in trophy_data:
                    trophy_data[normalized] = {
                        "trophy_id": trophy.np_communication_id,
                        "trophy_name": name,
                    }
        except Exception as e:
            if "forbidden" in str(e).lower() or "private" in str(e).lower():
                raise PSNServiceError(f"User '{username}' has a private profile.")
            raise PSNServiceError(f"Failed to fetch trophy data: {e}")
        
        # Process title stats for playtime
        games = []
        try:
            for stat in title_stats:
                name = stat.name or ""
                
                # Clean name for matching (same logic as get_games_by_username)
                if " – " in name:
                    name = name.split(" – ")[0]
                if " - " in name:
                    parts = name.split(" - ")
                    if len(parts) == 2 and any(word in parts[1].lower() for word in ['season', 'update', 'edition', 'version']):
                        name = parts[0]
                
                name = name.replace("™", "").replace("®", "").replace("©", "")
                name = re.sub(r'([a-zA-Z])(\d)', r'\1 \2', name)
                name = re.sub(r'\s*:\s*', ': ', name)
                name = " ".join(name.split()).strip()
                
                # Skip non-game apps
                non_games = [
                    'Netflix', 'YouTube', 'Spotify', 'Twitch', 'Disney+', 'Hulu', 
                    'Prime Video', 'HBO Max', 'Crunchyroll', 'Share Factory Studio',
                    'ShareFactory', 'Media Player', 'PlayStation Now', 'PlayStation Plus',
                    'Plex', 'Apple TV', 'Paramount+', 'Peacock'
                ]
                if any(app.lower() in name.lower() for app in non_games):
                    continue
                
                # Find matching trophy data by name
                normalized = name.lower()
                trophy_info = trophy_data.get(normalized)
                
                # Get playtime
                play_mins = 0
                if stat.play_duration:
                    play_mins = int(stat.play_duration.total_seconds() / 60)
                
                games.append({
                    "trophy_id": trophy_info["trophy_id"] if trophy_info else None,
                    "title_id": stat.title_id,
                    "name": name,
                    "psn_name": stat.name,  # Original PSN name
                    "image_url": stat.image_url,
                    "play_duration_minutes": play_mins,
                    "play_count": stat.play_count or 0,
                    "last_played": stat.last_played_date_time,
                    "first_played": stat.first_played_date_time,
                })
        except Exception as e:
            if "forbidden" in str(e).lower() or "private" in str(e).lower():
                raise PSNServiceError(f"User '{username}' has a private profile.")
            raise PSNServiceError(f"Failed to fetch games: {e}")
        
        # Aggregate duplicates by trophy_id (prefer) or name
        aggregated = {}
        for game in games:
            # Use trophy_id as key if available, otherwise name
            key = game["trophy_id"] or game["name"]
            
            if key in aggregated:
                # Sum playtime and play count
                aggregated[key]["play_duration_minutes"] += game["play_duration_minutes"]
                aggregated[key]["play_count"] += game["play_count"]
                # Keep most recent last_played
                if game["last_played"] and (not aggregated[key]["last_played"] or game["last_played"] > aggregated[key]["last_played"]):
                    aggregated[key]["last_played"] = game["last_played"]
                if game["first_played"] and (not aggregated[key]["first_played"] or game["first_played"] < aggregated[key]["first_played"]):
                    aggregated[key]["first_played"] = game["first_played"]
            else:
                aggregated[key] = game.copy()
        
        games_list = list(aggregated.values())
        
        # Look up IGDB IDs from mapping cache for games with trophy_id
        from ..models.psn_igdb_mapping import PsnIgdbMapping
        from ...db_setup import SessionLocal
        
        db = SessionLocal()
        try:
            trophy_ids = [g["trophy_id"] for g in games_list if g.get("trophy_id")]
            if trophy_ids:
                mappings = db.query(PsnIgdbMapping).filter(
                    PsnIgdbMapping.trophy_id.in_(trophy_ids)
                ).all()
                mapping_dict = {m.trophy_id: m.igdb_id for m in mappings}
                
                # Add igdb_id to games that have cached mappings
                for game in games_list:
                    if game.get("trophy_id") and game["trophy_id"] in mapping_dict:
                        game["igdb_id"] = mapping_dict[game["trophy_id"]]
                    else:
                        game["igdb_id"] = None
        finally:
            db.close()
        
        return games_list
        
    except PSNServiceError:
        raise
    except Exception as e:
        raise PSNServiceError(f"Failed to get PSN games with trophy IDs: {e}")

def verify_psn_username(username: str) -> dict:
    """
    Verify a PSN username exists and is accessible.
    
    Args:
        username: PSN online_id
        
    Returns:
        User profile data if valid
        
    Raises:
        PSNServiceError: If user not found or inaccessible
    """
    try:
        psnawp = _get_psnawp_client()
        user = psnawp.user(online_id=username)
        
        # User object has online_id and account_id directly
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
    Link a PSN account to a GameGloom user by username.
    
    Args:
        db: Database session
        user_id: GameGloom user ID
        username: PSN online_id (username)
        
    Returns:
        Created or updated UserPlatformLink
    """
    # Verify username exists and get profile
    profile = verify_psn_username(username)
    
    # Check if already linked
    existing = db.query(UserPlatformLink).filter(
        UserPlatformLink.user_id == user_id,
        UserPlatformLink.platform == PlatformType.PSN.value
    ).first()
    
    if existing:
        # Update existing link
        existing.platform_user_id = profile["account_id"]
        existing.platform_username = profile["online_id"]
        existing.access_token = None  # No longer storing NPSSO
        existing.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return existing
    
    # Create new link
    link = UserPlatformLink(
        user_id=user_id,
        platform=PlatformType.PSN.value,
        platform_user_id=profile["account_id"],
        platform_username=profile["online_id"],
        access_token=None,  # No longer storing NPSSO
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def unlink_psn_account(db: Session, user_id: int) -> bool:
    """
    Unlink PSN account from a GameGloom user.
    
    Args:
        db: Database session
        user_id: GameGloom user ID
        
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
        return True
    return False


def get_psn_link(db: Session, user_id: int) -> Optional[UserPlatformLink]:
    """Get the PSN link for a user, if it exists."""
    return db.query(UserPlatformLink).filter(
        UserPlatformLink.user_id == user_id,
        UserPlatformLink.platform == PlatformType.PSN.value
    ).first()
