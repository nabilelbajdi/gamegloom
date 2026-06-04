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

    def test_converts_unicode_roman_numerals(self):
        assert clean_name("Final Fantasy Ⅶ") == "Final Fantasy VII"


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
