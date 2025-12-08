# backend/tests/test_services.py
"""
Tests for game data processing services.
Tests focus on data transformation and quality validation logic.
"""
import pytest
from backend.app.api.v1.core.services import process_igdb_data, meets_quality_requirements
from backend.app.api.v1.core.schemas import GameCreate


class TestProcessIgdbData:
    """Tests for IGDB data transformation."""
    
    def test_process_basic_game_data(self):
        """Test processing basic game data from IGDB format."""
        igdb_data = {
            "id": 12345,
            "name": "Test Game",
            "summary": "A test game summary",
            "slug": "test-game",
            "cover": {"image_id": "co1234"},
            "genres": [{"name": "Action"}, {"name": "RPG"}],
            "platforms": [{"name": "PC"}, {"name": "PlayStation 5"}],
            "rating": 85.5,
            "total_rating": 82.0,
            "total_rating_count": 1500,
        }
        
        result = process_igdb_data(igdb_data)
        
        assert isinstance(result, GameCreate)
        assert result.igdb_id == 12345
        assert result.name == "Test Game"
        assert result.summary == "A test game summary"
        assert result.slug == "test-game"
        assert "co1234" in result.cover_image
        assert "Action" in result.genres
        assert "RPG" in result.genres
        assert "PC" in result.platforms

    def test_process_game_with_missing_optional_fields(self):
        """Test processing a game with minimal data."""
        igdb_data = {
            "id": 999,
            "name": "Minimal Game",
        }
        
        result = process_igdb_data(igdb_data)
        
        assert result.igdb_id == 999
        assert result.name == "Minimal Game"
        assert result.summary is None
        assert result.cover_image is None
        assert result.genres == ""

    def test_process_game_with_similar_games(self):
        """Test processing a game with similar games."""
        igdb_data = {
            "id": 100,
            "name": "Main Game",
            "similar_games": [
                {"id": 101, "name": "Similar 1", "cover": {"image_id": "sim1"}, "slug": "similar-1"},
                {"id": 102, "name": "Similar 2", "cover": {"image_id": "sim2"}, "slug": "similar-2"},
            ]
        }
        
        result = process_igdb_data(igdb_data)
        
        assert result.similar_games is not None
        assert len(result.similar_games) == 2
        # similar_games are SimilarGame schema objects
        assert result.similar_games[0].name == "Similar 1"

    def test_process_game_with_involved_companies(self):
        """Test extracting developers and publishers from involved_companies."""
        igdb_data = {
            "id": 200,
            "name": "Studio Game",
            "involved_companies": [
                {"company": {"name": "Cool Dev Studio"}, "developer": True, "publisher": False},
                {"company": {"name": "Big Publisher"}, "developer": False, "publisher": True},
            ]
        }
        
        result = process_igdb_data(igdb_data)
        
        assert "Cool Dev Studio" in result.developers
        assert "Big Publisher" in result.publishers

    def test_process_game_with_dlcs_and_expansions(self):
        """Test processing DLCs and expansions."""
        igdb_data = {
            "id": 300,
            "name": "Base Game",
            "dlcs": [
                {"id": 301, "name": "DLC Pack 1", "cover": {"image_id": "dlc1"}},
            ],
            "expansions": [
                {"id": 302, "name": "Big Expansion", "cover": {"image_id": "exp1"}},
            ]
        }
        
        result = process_igdb_data(igdb_data)
        
        assert len(result.dlcs) == 1
        assert result.dlcs[0]["name"] == "DLC Pack 1"
        assert len(result.expansions) == 1
        assert result.expansions[0]["name"] == "Big Expansion"

    def test_process_game_type_mapping(self):
        """Test game type ID to name mapping."""
        igdb_data = {
            "id": 400,
            "name": "Main Game",
            "game_type": 0  # Should map to "Main Game"
        }
        
        result = process_igdb_data(igdb_data)
        
        assert result.game_type_id == 0
        assert result.game_type_name == "Main Game"

    def test_process_dlc_type_mapping(self):
        """Test DLC game type mapping."""
        igdb_data = {
            "id": 401,
            "name": "Some DLC",
            "game_type": 1  # Should map to "DLC/Addon"
        }
        
        result = process_igdb_data(igdb_data)
        
        assert result.game_type_id == 1
        assert result.game_type_name == "DLC/Addon"


class TestMeetsQualityRequirements:
    """Tests for game quality validation."""
    
    def test_quality_game_passes(self):
        """Test that a quality game passes requirements."""
        game_data = GameCreate(
            igdb_id=1,
            name="Quality Game",
            summary="A great summary of the game.",
            cover_image="https://example.com/cover.jpg",
            game_type_id=0,
        )
        
        assert meets_quality_requirements(game_data, log_warnings=False) is True

    def test_game_without_cover_fails(self):
        """Test that a game without cover image fails."""
        game_data = GameCreate(
            igdb_id=2,
            name="No Cover Game",
            summary="Has a summary but no cover.",
            cover_image=None,
            game_type_id=0,
        )
        
        assert meets_quality_requirements(game_data, log_warnings=False) is False

    def test_game_without_description_fails(self):
        """Test that a game without summary or storyline fails."""
        game_data = GameCreate(
            igdb_id=3,
            name="No Description Game",
            summary=None,
            storyline=None,
            cover_image="https://example.com/cover.jpg",
            game_type_id=0,
        )
        
        assert meets_quality_requirements(game_data, log_warnings=False) is False

    def test_game_with_storyline_passes(self):
        """Test that a game with storyline (but no summary) passes."""
        game_data = GameCreate(
            igdb_id=4,
            name="Story Game",
            summary=None,
            storyline="An epic storyline unfolds...",
            cover_image="https://example.com/cover.jpg",
            game_type_id=0,
        )
        
        assert meets_quality_requirements(game_data, log_warnings=False) is True

    def test_mod_game_type_fails(self):
        """Test that mods are rejected."""
        game_data = GameCreate(
            igdb_id=5,
            name="Cool Mod",
            summary="A great mod.",
            cover_image="https://example.com/cover.jpg",
            game_type_id=5,  # Mod
        )
        
        assert meets_quality_requirements(game_data, log_warnings=False) is False

    def test_pack_game_type_fails(self):
        """Test that packs are rejected."""
        game_data = GameCreate(
            igdb_id=6,
            name="DLC Pack",
            summary="A pack of items.",
            cover_image="https://example.com/cover.jpg",
            game_type_id=13,  # Pack
        )
        
        assert meets_quality_requirements(game_data, log_warnings=False) is False

    def test_update_game_type_fails(self):
        """Test that updates are rejected."""
        game_data = GameCreate(
            igdb_id=7,
            name="Game Update",
            summary="Version 1.5 update.",
            cover_image="https://example.com/cover.jpg",
            game_type_id=14,  # Update
        )
        
        assert meets_quality_requirements(game_data, log_warnings=False) is False
