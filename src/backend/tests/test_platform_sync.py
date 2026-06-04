# backend/tests/test_platform_sync.py
"""
DB-backed tests for the platform integration layer: IGDB matching cascade,
cross-platform playtime aggregation on import, and the concurrent-sync guard.
"""
import pytest
from fastapi import HTTPException

from app.api.v1.services import psn_service, platform_sync_service
from app.api.v1.routers.integrations import _sync_guard
from app.api.v1.models.game import Game
from app.api.v1.models.user_game import UserGame, GameStatus
from app.api.v1.models.user_platform_game import UserPlatformGame


class TestPsnMatching:
    def test_matches_two_digit_disambiguation_slug(self, db_session):
        """A game IGDB stored with a 2-digit disambiguation suffix (--10) still matches."""
        db_session.add(Game(igdb_id=500, name="Some Game", slug="some-game--10"))
        db_session.commit()

        igdb_id, name, cover, confidence, method = psn_service.match_game_to_igdb(
            db_session, platform_id="CUSA99999_00", platform_name="Some Game"
        )
        assert igdb_id == 500
        assert method == "slug"

    def test_returns_unmatched_when_nothing_matches(self, db_session):
        result = psn_service.match_game_to_igdb(
            db_session, platform_id="CUSA00000_00", platform_name="Nonexistent Title Xyz"
        )
        assert result == (None, None, None, None, None)


class TestImportAggregation:
    def test_import_sums_playtime_across_platforms(self, db_session):
        """Importing a game already in the library aggregates playtime from all platform caches."""
        game = Game(igdb_id=700, name="Aggregated Game", slug="aggregated-game")
        db_session.add(game)
        db_session.commit()
        db_session.refresh(game)

        db_session.add(UserGame(
            user_id=1, game_id=game.id, status=GameStatus.PLAYED, playtime_minutes=0
        ))
        db_session.add(UserPlatformGame(
            user_id=1, platform="steam", platform_id="100", platform_name="Aggregated Game",
            igdb_id=700, playtime_minutes=100, status="pending"
        ))
        db_session.add(UserPlatformGame(
            user_id=1, platform="psn", platform_id="CUSA1_00", platform_name="Aggregated Game",
            igdb_id=700, playtime_minutes=50, status="pending"
        ))
        db_session.commit()

        imported, skipped = platform_sync_service.import_games_to_library(
            db_session, user_id=1, platform="steam",
            games_data=[{"igdb_id": 700, "platform_id": "100", "list_type": "played"}]
        )

        assert imported == 0  # already in library
        assert skipped == 1

        user_game = db_session.query(UserGame).filter(UserGame.user_id == 1).first()
        assert user_game.playtime_minutes == 150  # 100 (steam) + 50 (psn)

        # Both platform cache entries get marked imported
        entries = db_session.query(UserPlatformGame).filter(UserPlatformGame.user_id == 1).all()
        assert all(e.status == "imported" for e in entries)


class TestSyncGuard:
    def test_blocks_second_concurrent_sync_and_releases(self):
        with _sync_guard(1, "psn"):
            with pytest.raises(HTTPException) as exc:
                with _sync_guard(1, "psn"):
                    pass
            assert exc.value.status_code == 409
        # Slot released after the first sync exits -> a new sync can start
        with _sync_guard(1, "psn"):
            pass

    def test_different_user_or_platform_not_blocked(self):
        with _sync_guard(1, "psn"):
            with _sync_guard(2, "psn"):  # different user
                pass
            with _sync_guard(1, "steam"):  # different platform
                pass
