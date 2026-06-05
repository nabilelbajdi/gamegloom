# backend/tests/test_platform_sync.py
"""
DB-backed tests for the platform integration layer: IGDB matching cascade,
cross-platform playtime aggregation on import, and the concurrent-sync guard.
"""
from datetime import datetime

import pytest
from fastapi import HTTPException

from app.api.v1.services import psn_service, platform_sync_service
from app.api.v1.core.matching_utils import find_igdb_match, TRUSTED_CONFIDENCE
from app.api.v1.routers.integrations import _sync_guard
from app.api.v1.models.game import Game
from app.api.v1.models.user_game import UserGame, GameStatus
from app.api.v1.models.user_platform_game import UserPlatformGame
from app.api.v1.models.psn_title_lookup import PsnTitleLookup


class TestFindIgdbMatch:
    """The unified name matcher: high-confidence steps vs low-confidence suggestions."""

    def test_strips_platform_tag(self, db_session):
        db_session.add(Game(igdb_id=1, name="It Takes Two", slug="it-takes-two"))
        db_session.commit()
        igdb_id, _, _, conf, _ = find_igdb_match(db_session, "It Takes Two PS 4 & PS 5")
        assert igdb_id == 1 and conf >= TRUSTED_CONFIDENCE

    def test_strips_edition_suffix(self, db_session):
        db_session.add(Game(igdb_id=2, name="Injustice: Gods Among Us", slug="injustice-gods-among-us"))
        db_session.commit()
        igdb_id, _, _, conf, _ = find_igdb_match(db_session, "Injustice: Gods Among Us Ultimate Edition")
        assert igdb_id == 2 and conf >= TRUSTED_CONFIDENCE

    def test_strips_publisher_prefix(self, db_session):
        db_session.add(Game(igdb_id=3, name="Rainbow Six Siege", slug="rainbow-six-siege"))
        db_session.commit()
        igdb_id, _, _, conf, _ = find_igdb_match(db_session, "Tom Clancy's Rainbow Six Siege")
        assert igdb_id == 3 and conf >= TRUSTED_CONFIDENCE

    def test_punctuation_insensitive_normalized_match(self, db_session):
        # IGDB name carries punctuation (and a UUID-suffixed slug) the PSN name lacks.
        db_session.add(Game(igdb_id=4, name="Plants vs. Zombies: Garden Warfare",
                            slug="plants-vs-zombies-garden-warfare-2e561d33"))
        db_session.commit()
        igdb_id, _, _, conf, method = find_igdb_match(db_session, "Plants vs Zombies Garden Warfare")
        assert igdb_id == 4 and method == "normalized" and conf >= TRUSTED_CONFIDENCE

    def test_letter_digit_title_matches_via_subtitle_suggestion(self, db_session):
        db_session.add(Game(igdb_id=5, name="H1Z1", slug="h1z1"))
        db_session.commit()
        igdb_id, _, _, conf, method = find_igdb_match(db_session, "H1Z1: Battle Royale")
        assert igdb_id == 5 and method == "subtitle"

    def test_subtitle_drop_is_low_confidence_suggestion(self, db_session):
        db_session.add(Game(igdb_id=6, name="Fall Guys", slug="fall-guys"))
        db_session.commit()
        igdb_id, _, _, conf, _ = find_igdb_match(db_session, "Fall Guys: Ultimate Knockout")
        assert igdb_id == 6 and conf < TRUSTED_CONFIDENCE  # confirm-in-review, not auto-ready

    def test_no_false_positive_for_unknown_title(self, db_session):
        db_session.add(Game(igdb_id=7, name="Hollow Knight", slug="hollow-knight"))
        db_session.commit()
        assert find_igdb_match(db_session, "Totally Made Up Nonexistent Title Qwxyz") == (None, None, None, None, None)


class TestSequelDisambiguation:
    """Two IGDB entries with a byte-identical name (Overwatch / Overwatch 2) routed by
    the sequel number in the disambiguation (Sony lookup) name."""

    def _seed_two_overwatch(self, db):
        # Both literally named "Overwatch"; only release date + id differ.
        db.add(Game(igdb_id=8173, name="Overwatch", slug="overwatch",
                    first_release_date=datetime(2016, 5, 24)))
        db.add(Game(igdb_id=125174, name="Overwatch", slug="overwatch--1",
                    first_release_date=datetime(2023, 8, 10)))
        db.commit()

    def test_hint_with_number_picks_newer(self, db_session):
        self._seed_two_overwatch(db_session)
        igdb_id, _, _, conf, method = find_igdb_match(db_session, "Overwatch", disambig_name="Overwatch 2")
        assert igdb_id == 125174 and conf == 0.95 and method == "name_sequel"

    def test_hint_without_number_picks_older(self, db_session):
        self._seed_two_overwatch(db_session)
        igdb_id, _, _, _, method = find_igdb_match(db_session, "Overwatch", disambig_name="Overwatch: Origins Edition")
        assert igdb_id == 8173 and method == "name_sequel"

    def test_beta_hint_routes_by_number(self, db_session):
        self._seed_two_overwatch(db_session)
        igdb_id, _, _, _, _ = find_igdb_match(db_session, "Overwatch", disambig_name="Overwatch 2 Beta")
        assert igdb_id == 125174

    def test_out_of_range_ordinal_falls_back(self, db_session):
        # Hint says "5" but only 2 candidates -> fall back to pick_best_match (lowest id here).
        self._seed_two_overwatch(db_session)
        igdb_id, _, _, _, method = find_igdb_match(db_session, "Overwatch", disambig_name="Overwatch 5")
        assert igdb_id == 8173 and method == "name"

    def test_single_candidate_with_hint_unchanged(self, db_session):
        db_session.add(Game(igdb_id=8173, name="Overwatch", slug="overwatch",
                            first_release_date=datetime(2016, 5, 24)))
        db_session.commit()
        igdb_id, _, _, _, method = find_igdb_match(db_session, "Overwatch", disambig_name="Overwatch 2")
        assert igdb_id == 8173 and method == "name"

    def test_no_hint_unchanged(self, db_session):
        self._seed_two_overwatch(db_session)
        igdb_id, _, _, _, method = find_igdb_match(db_session, "Overwatch")
        assert igdb_id == 8173 and method == "name"

    def test_psn_lookup_name_drives_split(self, db_session):
        self._seed_two_overwatch(db_session)
        db_session.add(PsnTitleLookup(title_id="PPSA07821_00", name="Overwatch 2"))
        db_session.commit()
        igdb_id, _, _, _, _ = psn_service.match_game_to_igdb(
            db_session, platform_id="PPSA07821_00", platform_name="Overwatch"
        )
        assert igdb_id == 125174


class TestPsnMatching:
    def test_matches_two_digit_disambiguation_slug(self, db_session):
        """A game IGDB stored with a 2-digit disambiguation suffix (--10) still matches.

        The IGDB name differs from the PSN name so the exact-name step is skipped
        and the slug disambiguation path (the behaviour under test) is exercised.
        """
        db_session.add(Game(igdb_id=500, name="Some Game (Remastered)", slug="some-game--10"))
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


class TestResyncRetryMatch:
    """Re-sync re-matches previously-unmatched cache rows without clobbering existing matches."""

    def test_resync_matches_unmatched_and_preserves_existing(self, db_session, monkeypatch):
        # Two IGDB games now exist that earlier syncs couldn't match against.
        db_session.add(Game(igdb_id=800, name="Stardew Valley", slug="stardew-valley"))
        db_session.add(Game(igdb_id=801, name="Celeste", slug="celeste"))

        # Row A: cached unmatched -> should pick up the new match on re-sync.
        db_session.add(UserPlatformGame(
            user_id=1, platform="psn", platform_id="CUSA_A", platform_name="Stardew Valley",
            igdb_id=None, status="pending", playtime_minutes=0
        ))
        # Row B: already matched to a (stale/manual) id -> must stay untouched even
        # though "Celeste" would now match igdb_id 801.
        db_session.add(UserPlatformGame(
            user_id=1, platform="psn", platform_id="CUSA_B", platform_name="Celeste",
            igdb_id=900, status="pending", playtime_minutes=0
        ))
        db_session.commit()

        def fake_get_psn_games(username):
            return [
                {"title_id": "CUSA_A", "name": "Stardew Valley", "image_url": None,
                 "play_duration_minutes": 0, "first_played": None, "last_played": None},
                {"title_id": "CUSA_B", "name": "Celeste", "image_url": None,
                 "play_duration_minutes": 0, "first_played": None, "last_played": None},
            ]
        monkeypatch.setattr(psn_service, "get_psn_games", fake_get_psn_games)

        platform_sync_service.sync_psn_library(
            db_session, user_id=1, username="tester", existing_igdb_ids=set()
        )

        row_a = db_session.query(UserPlatformGame).filter_by(platform_id="CUSA_A").first()
        row_b = db_session.query(UserPlatformGame).filter_by(platform_id="CUSA_B").first()
        assert row_a.igdb_id == 800 and row_a.match_method is not None  # newly matched
        assert row_b.igdb_id == 900  # existing match preserved, not overwritten

    def test_steam_resync_matches_unmatched_and_preserves_existing(self, db_session, monkeypatch):
        from app.api.v1.services import steam_service

        db_session.add(Game(igdb_id=800, name="Stardew Valley", slug="stardew-valley"))
        db_session.add(Game(igdb_id=801, name="Celeste", slug="celeste"))

        db_session.add(UserPlatformGame(
            user_id=1, platform="steam", platform_id="A", platform_name="Stardew Valley",
            igdb_id=None, status="pending", playtime_minutes=0
        ))
        db_session.add(UserPlatformGame(
            user_id=1, platform="steam", platform_id="B", platform_name="Celeste",
            igdb_id=900, status="pending", playtime_minutes=0
        ))
        db_session.commit()

        def fake_get_owned_games(steam_id):
            return [
                {"appid": "A", "name": "Stardew Valley", "playtime_forever": 0, "rtime_last_played": 0},
                {"appid": "B", "name": "Celeste", "playtime_forever": 0, "rtime_last_played": 0},
            ]
        monkeypatch.setattr(steam_service, "get_owned_games", fake_get_owned_games)

        platform_sync_service.sync_steam_library(
            db_session, user_id=1, steam_id="123", existing_igdb_ids=set()
        )

        row_a = db_session.query(UserPlatformGame).filter_by(platform_id="A").first()
        row_b = db_session.query(UserPlatformGame).filter_by(platform_id="B").first()
        assert row_a.igdb_id == 800 and row_a.match_method is not None  # newly matched (local matcher)
        assert row_b.igdb_id == 900  # existing match preserved, not overwritten


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
