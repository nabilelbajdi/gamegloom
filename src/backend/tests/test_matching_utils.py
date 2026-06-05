# backend/tests/test_matching_utils.py
"""
Tests for the shared platform->IGDB matching helpers (name cleaning, slugs,
non-game filtering, disambiguation). These are pure functions, no DB or network.
"""
from datetime import datetime

from app.api.v1.core.matching_utils import (
    is_non_game,
    clean_name,
    clean_platform_name,
    generate_slug,
    slug_with_roman_numerals,
    pick_best_match,
    strip_edition,
    strip_platform_tags,
    strip_publisher_prefix,
    drop_subtitle,
    normalize_for_match,
)
from app.api.v1.models.game import Game


class TestIsNonGame:
    def test_known_app_is_non_game(self):
        assert is_non_game("Spotify") is True
        assert is_non_game("netflix") is True

    def test_pattern_match_is_non_game(self):
        assert is_non_game("Demo Disc") is True
        assert is_non_game("Awesome Game Benchmark") is True

    def test_real_game_is_not_non_game(self):
        assert is_non_game("Halo Infinite") is False

    def test_empty_is_not_non_game(self):
        assert is_non_game("") is False


class TestCleanName:
    def test_strips_trademark_symbols(self):
        assert clean_name("Halo™") == "Halo"
        assert clean_name("Game®") == "Game"

    def test_adds_space_between_letter_and_number(self):
        assert clean_name("LittleBigPlanet3") == "LittleBigPlanet 3"

    def test_no_split_keeps_alphanumeric_token(self):
        assert clean_name("H1Z1", split_alnum=False) == "H1Z1"
        assert clean_name("OlliOlli2", split_alnum=False) == "OlliOlli2"

    def test_converts_unicode_roman_numerals(self):
        assert clean_name("Final Fantasy Ⅶ") == "Final Fantasy VII"

    def test_trademark_between_letter_and_roman_numeral(self):
        # The ™ must be removed before the Roman numeral spacing runs.
        assert clean_name("SOULCALIBUR™Ⅵ") == "SOULCALIBUR VI"


class TestStripHelpers:
    def test_strip_edition_hyphen_and_trailing(self):
        assert strip_edition("Divinity: Original Sin 2 - Definitive Edition") == "Divinity: Original Sin 2"
        assert strip_edition("Injustice: Gods Among Us Ultimate Edition") == "Injustice: Gods Among Us"
        assert strip_edition("BioShock Infinite: The Complete Edition") == "BioShock Infinite"

    def test_strip_edition_leaves_plain_name(self):
        assert strip_edition("Hollow Knight") == "Hollow Knight"

    def test_strip_platform_tags(self):
        assert strip_platform_tags("It Takes Two PS 4 & PS 5") == "It Takes Two"
        assert strip_platform_tags("Bloodborne PS4") == "Bloodborne"

    def test_strip_publisher_prefix(self):
        assert strip_publisher_prefix("Tom Clancy's Rainbow Six Siege") == "Rainbow Six Siege"
        assert strip_publisher_prefix("Hades") == "Hades"

    def test_drop_subtitle(self):
        assert drop_subtitle("Fall Guys: Ultimate Knockout") == "Fall Guys"
        assert drop_subtitle("Hades") == "Hades"

    def test_normalize_for_match_is_punctuation_insensitive(self):
        assert normalize_for_match("Plants vs. Zombies: Garden Warfare") == \
            normalize_for_match("Plants vs Zombies Garden Warfare")
        assert normalize_for_match("OlliOlli2") == normalize_for_match("OlliOlli 2")


class TestCleanPlatformName:
    def test_removes_endash_edition_suffix(self):
        assert clean_platform_name("Destiny 2 – Season of the Deep") == "Destiny 2"

    def test_applies_franchise_fix(self):
        assert clean_platform_name("Assassins Creed") == "Assassin's Creed"


class TestGenerateSlug:
    def test_basic_slug(self):
        assert generate_slug("The Witcher 3: Wild Hunt") == "the-witcher-3-wild-hunt"

    def test_strips_special_characters(self):
        assert generate_slug("Marvel's Spider-Man") == "marvels-spider-man"


class TestSlugWithRomanNumerals:
    def test_converts_trailing_arabic_numeral(self):
        assert slug_with_roman_numerals("final-fantasy-7") == "final-fantasy-vii"
        assert slug_with_roman_numerals("portal-2") == "portal-ii"

    def test_leaves_slug_without_trailing_number(self):
        assert slug_with_roman_numerals("halo") == "halo"


class TestPickBestMatch:
    def test_returns_none_for_empty(self):
        assert pick_best_match([]) is None

    def test_returns_single_candidate(self):
        g = Game(igdb_id=1, name="Solo", slug="solo")
        assert pick_best_match([g]) is g

    def test_without_first_played_prefers_lowest_igdb_id(self):
        low = Game(igdb_id=10, name="A", slug="a")
        high = Game(igdb_id=99, name="A", slug="a")
        assert pick_best_match([high, low]) is low

    def test_with_first_played_picks_release_closest_before_cutoff(self):
        old = Game(igdb_id=10, name="Battlefront", slug="battlefront",
                   first_release_date=datetime(2004, 1, 1))
        new = Game(igdb_id=99, name="Battlefront", slug="battlefront",
                   first_release_date=datetime(2015, 11, 1))
        # Played in late 2015 -> the 2015 release is the intended one, not the 2004 one
        assert pick_best_match([old, new], first_played=datetime(2015, 12, 1)) is new
