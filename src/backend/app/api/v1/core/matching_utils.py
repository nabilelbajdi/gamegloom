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
    # Media-app brands with suffixed variants (YouTube, YouTube TV, YouTube Kids, ...)
    r"^youtube\b",
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


def clean_name(name: str, split_alnum: bool = True) -> str:
    """
    Clean a game name for matching:
    - Remove trademark symbols (™®©)
    - Convert Unicode Roman numerals
    - Fix spacing around numbers
    - Normalize Unicode

    split_alnum inserts a space between a letter and a following digit
    (LittleBigPlanet3 -> LittleBigPlanet 3). Disable it for titles where the
    letters and digits are one token (H1Z1, OlliOlli2) so we can also try the
    un-split form when matching.
    """
    if not name:
        return ""

    # Remove trademark symbols first so they don't sit between a letter and a
    # following Roman numeral ("SOULCALIBUR™Ⅵ"), which would block the spacing below.
    name = name.replace("™", "").replace("®", "").replace("©", "")

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

    # Fix spacing around numbers (LittleBigPlanet3 → LittleBigPlanet 3)
    if split_alnum:
        name = re.sub(r'([a-zA-Z])(\d)', r'\1 \2', name)

    return name.strip()


def clean_platform_name(name: str, split_alnum: bool = True) -> str:
    """
    Clean a platform game name for display and matching:
    - Removes season/edition suffixes
    - Removes trademark symbols
    - Fixes common franchise naming issues

    split_alnum is forwarded to clean_name (see there).
    """
    if not name:
        return ""

    # Remove edition suffixes like "– Season 20: Vendetta" or "Collectors Edition"
    # Note: We use " – " (en dash) as it's common in PSN titles
    if " – " in name:
        name = name.split(" – ")[0]

    # General cleanup
    name = clean_name(name, split_alnum=split_alnum)
    
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


def generate_slug(name: str, split_alnum: bool = True) -> str:
    """Generate IGDB-compatible slug from game name."""
    name = clean_name(name, split_alnum=split_alnum)
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
    
    def get_naive_release_date(g):
        """Get release date as naive datetime for comparison."""
        if not g.first_release_date:
            return None
        rd = g.first_release_date
        if hasattr(rd, 'tzinfo') and rd.tzinfo is not None:
            return rd.replace(tzinfo=None)
        return rd
    
    valid = [g for g in candidates
             if get_naive_release_date(g) and get_naive_release_date(g) <= cutoff]

    if valid:
        # Pick the most recent valid release (closest to first_played but before cutoff)
        return max(valid, key=lambda g: get_naive_release_date(g))

    # Fallback to lowest ID
    return min(candidates, key=lambda g: g.igdb_id)


# ═══════════════════════════════════════════════════════════════════
# Unified IGDB Matching
# ═══════════════════════════════════════════════════════════════════

# Matches at or above this confidence are trusted enough to land in the
# "Ready to Import" tab. Anything below is a suggestion the user confirms in
# the "Needs Review" tab before it touches their library.
TRUSTED_CONFIDENCE = 0.75

# An empty match result (igdb_id, igdb_name, cover_url, confidence, method).
NO_MATCH = (None, None, None, None, None)

# Edition / version / beta markers that platforms append but IGDB indexes the
# base game without. Longest phrases first so "complete edition" wins over a
# bare "edition". Order matters in the regex alternation.
EDITION_MARKERS = [
    "game of the year edition", "game of the year", "goty edition", "goty",
    "definitive edition", "complete edition", "complete collection", "complete story",
    "ultimate edition", "legendary edition", "collector's edition", "collectors edition",
    "deluxe edition", "gold edition", "special edition", "enhanced edition",
    "anniversary edition", "remastered edition", "digital edition", "standard edition",
    "royal edition", "definitive", "remastered", "remaster",
    "closed beta", "open beta", "beta version", "beta ver.", "beta ver", "beta", "demo",
]

_EDITION_RE = re.compile(
    r"\s*[:\-–]?\s*(the\s+)?(" + "|".join(re.escape(m) for m in EDITION_MARKERS) + r")\s*$",
    re.IGNORECASE,
)

# Platform tags PSN/Steam append to a title ("It Takes Two PS 4 & PS 5").
_PLATFORM_TAG_RE = re.compile(
    r"\s*[:\-–\(]?\s*((for\s+)?(ps\s?[345]|playstation\s?[345])(\s*[&/]\s*(ps\s?[345]|playstation\s?[345]))?)\)?\s*$",
    re.IGNORECASE,
)

# Publisher prefixes IGDB drops from some (not all) titles, so these are only
# tried as a fallback after the full name fails.
PUBLISHER_PREFIXES = ["tom clancy's ", "tom clancys "]


def strip_edition(name: str) -> str:
    """Strip trailing edition/version/beta markers, repeatedly (e.g. 'X Remastered Deluxe Edition')."""
    prev = None
    while name and name != prev:
        prev = name
        name = _EDITION_RE.sub("", name).strip(" :-–")
    return name


def strip_platform_tags(name: str) -> str:
    """Strip a trailing platform tag like 'PS4', 'PS5', 'PS 4 & PS 5'."""
    return _PLATFORM_TAG_RE.sub("", name).strip(" :-–")


def strip_publisher_prefix(name: str) -> str:
    """Strip a known publisher prefix like 'Tom Clancy's'."""
    low = name.lower()
    for prefix in PUBLISHER_PREFIXES:
        if low.startswith(prefix):
            return name[len(prefix):].strip()
    return name


def drop_subtitle(name: str) -> str:
    """Return the part before the first colon ('Fall Guys: Ultimate Knockout' -> 'Fall Guys')."""
    return name.split(":", 1)[0].strip()


def normalize_for_match(name: str) -> str:
    """Reduce a name to lowercase alphanumerics for punctuation-insensitive comparison."""
    name = normalize_unicode(clean_name(name, split_alnum=False))
    return re.sub(r"[^a-z0-9]", "", name.lower())


_PS_CONCEPT_RE = re.compile(r"store\.playstation\.com/.*?/concept/(\d+)", re.IGNORECASE)


def extract_ps_concept_id(external_games) -> Optional[int]:
    """
    Pull the Sony concept id from an IGDB external_games list. PlayStation entries
    carry a URL like store.playstation.com/en-us/concept/202994; that id is the same
    concept_id stored in psn_title_lookup, so it bridges a PSN title to an IGDB game.
    Returns None when there is no PlayStation entry.
    """
    for entry in external_games or []:
        url = (entry or {}).get("url") or ""
        m = _PS_CONCEPT_RE.search(url)
        if m:
            return int(m.group(1))
    return None


def _sequel_ordinal(disambig_name: Optional[str]) -> Optional[int]:
    """
    Ordinal used to pick among identically-named IGDB entries, read from a hint
    name's trailing sequel number after edition/beta/platform markers are stripped.
    "Overwatch 2" -> 2, "Overwatch 2 Beta" -> 2, "Overwatch: Origins Edition" -> 1.
    Returns None when no hint is given (so no disambiguation happens).
    """
    if not disambig_name:
        return None
    cleaned = strip_platform_tags(strip_edition(clean_name(disambig_name, split_alnum=False)))
    m = re.search(r"(\d+)\s*$", cleaned)
    return int(m.group(1)) if m else 1


# A name variant is a (display, slug-source) pair. The two differ only in
# whether a space was inserted between letters and digits: the display form
# matches IGDB names/slugs that keep the space ("LittleBigPlanet 3"), the
# slug-source form matches those that don't ("H1Z1", "OlliOlli2"). Both are
# tried so either spelling resolves.
def _variant_pairs(base: str, base_ns: str) -> List[tuple]:
    """Deterministic stripped (display, no-split) name pairs to try, in priority order."""
    pairs = []
    seen = set()

    def add(display: str, no_split: str):
        display, no_split = display.strip(), no_split.strip()
        if display and display not in seen:
            seen.add(display)
            pairs.append((display, no_split))

    add(base, base_ns)
    add(strip_edition(base), strip_edition(base_ns))
    add(strip_platform_tags(base), strip_platform_tags(base_ns))
    add(strip_platform_tags(strip_edition(base)), strip_platform_tags(strip_edition(base_ns)))
    add(strip_publisher_prefix(base), strip_publisher_prefix(base_ns))
    add(
        strip_publisher_prefix(strip_platform_tags(strip_edition(base))),
        strip_publisher_prefix(strip_platform_tags(strip_edition(base_ns))),
    )
    return pairs


def _match_name_exact(db: Session, name: str, name_ns: str, first_played: Optional[datetime],
                      sequel_ordinal: Optional[int] = None):
    """Exact/slug/normalized lookup for one name (display + no-split forms). Returns (Game, confidence, method) or None."""
    # Exact name (case-insensitive), both spellings. When several IGDB entries
    # share a name (originals vs remakes: Resident Evil 4, Demon's Souls), let
    # pick_best_match choose by release date relative to when it was played.
    for candidate in (name, name_ns):
        games = db.query(Game).filter(Game.name.ilike(candidate)).all()
        if games:
            # Byte-identical names (Overwatch / Overwatch 2): if a sequel ordinal
            # is in range, pick the Nth entry by release date instead of guessing
            # by play date. Out-of-range or no ordinal falls back to pick_best_match.
            if len(games) > 1 and sequel_ordinal and 1 <= sequel_ordinal <= len(games):
                ordered = sorted(games, key=lambda g: (
                    g.first_release_date is None, g.first_release_date or datetime.min, g.igdb_id))
                return (ordered[sequel_ordinal - 1], 0.95, "name_sequel")
            return (pick_best_match(games, first_played), 0.95, "name")

    slugs = []
    for slug in (generate_slug(name), generate_slug(name_ns, split_alnum=False)):
        if slug and slug not in slugs:
            slugs.append(slug)

    # Exact slug, then IGDB disambiguation suffixes (game--1, game--2, ...)
    for slug in slugs:
        candidates = db.query(Game).filter(
            (Game.slug == slug) | (Game.slug.like(f"{slug}--%"))
        ).all()
        if candidates:
            game = pick_best_match(candidates, first_played)
            if game:
                return (game, 0.90 if game.slug == slug else 0.82, "slug")

        # Roman-numeral form of the slug (final-fantasy-7 -> final-fantasy-vii)
        roman_slug = slug_with_roman_numerals(slug)
        if roman_slug != slug:
            candidates = db.query(Game).filter(
                (Game.slug == roman_slug) | (Game.slug.like(f"{roman_slug}--%"))
            ).all()
            if candidates:
                game = pick_best_match(candidates, first_played)
                if game:
                    return (game, 0.80, "slug_roman")

    # Punctuation-insensitive name match: pull a small candidate set by slug
    # prefix, then require the normalized names to be identical. Catches IGDB
    # names with punctuation we drop ("Plants vs. Zombies: Garden Warfare").
    target = normalize_for_match(name_ns)
    if target:
        for slug in slugs:
            for game in db.query(Game).filter(
                Game.slug.like(f"{slug}%")
            ).order_by(Game.igdb_id).limit(25).all():
                if normalize_for_match(game.name) == target:
                    return (game, 0.88, "normalized")

    # Reverse-subtitle: the platform reports the base title and IGDB appended a
    # subtitle after a colon ("Never Alone" -> "Never Alone: Kisima Ingitchuna").
    # The exact base-title-before-colon is specific enough to trust.
    for candidate in (name, name_ns):
        if len(candidate) >= 4:
            games = db.query(Game).filter(
                Game.name.ilike(f"{candidate}: %")
            ).order_by(Game.igdb_id).all()
            if games:
                return (pick_best_match(games, first_played), 0.85, "subtitle_add")

    return None


def find_igdb_match(
    db: Session,
    raw_name: str,
    first_played: Optional[datetime] = None,
    disambig_name: Optional[str] = None,
) -> tuple:
    """
    Match a platform game name to an IGDB game.

    disambig_name is a more specific source name (e.g. the Sony lookup name) used
    only to split byte-identical IGDB entries by sequel number ("Overwatch 2" picks
    the 2nd "Overwatch" by release). It changes nothing when names don't collide.

    Returns (igdb_id, igdb_name, cover_url, confidence, method); all None on no match.
    Confidence < TRUSTED_CONFIDENCE means it's a suggestion to confirm, not a sure match.
    """
    if not raw_name:
        return NO_MATCH

    base = clean_platform_name(raw_name)
    base_ns = clean_platform_name(raw_name, split_alnum=False)
    sequel_ordinal = _sequel_ordinal(disambig_name)

    # 1. High-confidence: the name and its deterministically-stripped variants.
    for name, name_ns in _variant_pairs(base, base_ns):
        result = _match_name_exact(db, name, name_ns, first_played, sequel_ordinal)
        if result:
            game, confidence, method = result
            return (game.igdb_id, game.name, game.cover_image, confidence, method)

    # 2. Suggestion: drop a trailing subtitle ("H1Z1: Battle Royale" -> "H1Z1").
    subtitle, subtitle_ns = drop_subtitle(base), drop_subtitle(base_ns)
    if subtitle and subtitle != base:
        result = _match_name_exact(db, subtitle, subtitle_ns, first_played)
        if result:
            game = result[0]
            return (game.igdb_id, game.name, game.cover_image, 0.65, "subtitle")

    # 3. Suggestion: partial prefix match on longer names.
    c_name = clean_name(base)
    if len(c_name) >= 5:
        candidates = db.query(Game).filter(
            Game.name.ilike(f"{c_name}%")
        ).order_by(Game.igdb_id).limit(5).all()
        if candidates:
            game = candidates[0]
            return (game.igdb_id, game.name, game.cover_image, 0.60, "partial")

    return NO_MATCH
