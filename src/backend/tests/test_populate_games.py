# backend/tests/test_populate_games.py
"""
Tests for the bulk game population script's query construction.
Guards the catalog quality floor against silent regression.
"""
from backend.scripts.populate_games import (
    MIN_TOTAL_RATING_COUNT,
    build_released_query,
    build_arg_parser,
)


class TestReleasedQuery:
    """Tests for the released-games IGDB query."""

    def test_rating_floor_is_three(self):
        assert MIN_TOTAL_RATING_COUNT == 3

    def test_query_uses_rating_floor(self):
        query = build_released_query(offset=0, batch_limit=500)
        assert f"total_rating_count >= {MIN_TOTAL_RATING_COUNT}" in query

    def test_query_keeps_cover_and_main_game_filters(self):
        query = build_released_query(offset=0, batch_limit=500)
        assert "cover != null" in query
        assert "version_parent = null" in query

    def test_query_paginates_with_offset_and_limit(self):
        query = build_released_query(offset=1000, batch_limit=250)
        assert "limit 250" in query
        assert "offset 1000" in query


class TestArgDefaults:
    """Tests for CLI defaults."""

    def test_limit_default_is_25000(self):
        args = build_arg_parser().parse_args([])
        assert args.limit == 25000
