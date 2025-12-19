# core/matching_utils.py
"""
Shared utilities for matching platform games to IGDB.
Common logic for name cleaning, slug generation, and disambiguation.
"""
import re
import unicodedata
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from sqlalchemy.orm import Session

from ..models.game import Game

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════
# Non-Game Blocklist - apps/media/demos to filter out during sync
# ═══════════════════════════════════════════════════════════════════

NON_GAME_TITLES = {
    # Media apps
    "spotify", "netflix", "youtube", "amazon prime video", "hulu", "disney+",
    "apple tv", "crunchyroll", "plex", "twitch", "hbo max", "peacock",
    "paramount+", "amazon video", "vudu", "vidzone", "vrideo", "vrideo vr",
    # Steam-specific
    "steamvr", "steamvr collectables", "steamvr tutorial",
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
    # Steam specific non-games
    r"dedicated server",
    r"configurator$",
    r"sdk$",
    r"redistributable",
    r"benchmark$",
    r"system translator",
    r"content builder",
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
# Name Cleaning & Normalization
# ═══════════════════════════════════════════════════════════════════

def normalize_unicode(text: str) -> str:
    """Normalize Unicode chars (ö→o, é→e) using NFD decomposition."""
    normalized = unicodedata.normalize('NFD', text)
    return ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')


def clean_name(name: str) -> str:
    """
    Clean a game name for matching:
    - Remove trademark symbols (™®©)
    - Convert Unicode Roman numerals
    - Fix spacing around numbers
    - Normalize Unicode
    """
    if not name:
        return ""

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


def clean_platform_name(name: str) -> str:
    """
    Clean a platform game name for display and matching:
    - Removes season/edition suffixes
    - Removes trademark symbols
    - Fixes common franchise naming issues
    """
    if not name:
        return ""
    
    # Remove edition suffixes like "– Season 20: Vendetta" or "Collectors Edition"
    # Note: We use " – " (en dash) as it's common in PSN titles
    if " – " in name:
        name = name.split(" – ")[0]
    
    # General cleanup
    name = clean_name(name)
    
    # Fix common franchise naming (add colons where IGDB expects them)
    franchise_fixes = {
        'Call of Duty Ghosts': 'Call of Duty: Ghosts',
        'Call of Duty Black Ops': 'Call of Duty: Black Ops',
        'Call of Duty Modern Warfare': 'Call of Duty: Modern Warfare',
        'Divinity : Original Sin': 'Divinity: Original Sin',
        'Counter Strike Global Offensive': 'Counter-Strike: Global Offensive',
        'Counter Strike': 'Counter-Strike',
        'Assassins Creed': "Assassin's Creed",
        'Far Cry': 'Far Cry',
    }
    for wrong, correct in franchise_fixes.items():
        if wrong in name:
            name = name.replace(wrong, correct)

    
    # Fix spacing around colons
    name = re.sub(r'\s*:\s*', ': ', name)
    
    # Clean up extra whitespace
    return " ".join(name.split()).strip()


def generate_slug(name: str) -> str:
    """Generate IGDB-compatible slug from game name."""
    name = clean_name(name)
    name = normalize_unicode(name)
    
    slug = name.lower()
    slug = slug.replace('_', ' ')
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


# Arabic to Roman numeral mapping for slug conversion
ARABIC_TO_ROMAN = {
    '10': 'x', '9': 'ix', '8': 'viii', '7': 'vii', '6': 'vi',
    '5': 'v', '4': 'iv', '3': 'iii', '2': 'ii', '1': 'i',
}


def slug_with_roman_numerals(slug: str) -> str:
    """Convert trailing Arabic numeral in slug to Roman numeral."""
    for arabic, roman in ARABIC_TO_ROMAN.items():
        if slug.endswith(f'-{arabic}'):
            return slug[:-len(arabic)-1] + f'-{roman}'
    return slug


# ═══════════════════════════════════════════════════════════════════
# Disambiguation
# ═══════════════════════════════════════════════════════════════════

def pick_best_match(candidates: List[Game], first_played: Optional[datetime] = None) -> Game:
    """
    Pick the best match from multiple candidate games.
    Uses release date to disambiguate (e.g., 2015 Star Wars Battlefront vs 2004).
    """
    if not candidates:
        return None
        
    if len(candidates) == 1:
        return candidates[0]
    
    if not first_played:
        # No first_played info - prefer newest game (usually the one people mean)
        # or the one with lower igdb_id (usually the original/English entry)
        return min(candidates, key=lambda g: g.igdb_id)
    
    # Make first_played timezone-naive for comparison
    if hasattr(first_played, 'tzinfo') and first_played.tzinfo is not None:
        first_played = first_played.replace(tzinfo=None)
    
    # Allow games released up to ~2 months after first_played
    cutoff = first_played + timedelta(days=60)
    
    valid = [g for g in candidates 
             if g.first_release_date and g.first_release_date <= cutoff]
    
    if valid:
        # Pick the most recent valid release (closest to first_played but before cutoff)
        return max(valid, key=lambda g: g.first_release_date)
    
    # Fallback to lowest ID
    return min(candidates, key=lambda g: g.igdb_id)
