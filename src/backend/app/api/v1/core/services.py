# services.py
"""
Service layer entry point.

This module re-exports all service functions from focused modules for backward compatibility.
Import from here or directly from the specific service module.

Modules:
- igdb_service: IGDB API integration and data processing
- game_service: Game CRUD operations and database queries
- discovery_service: Trending, anticipated, highly rated, latest games
- swr_service: Stale-While-Revalidate pattern for data freshness
- search_service: Game search functionality
"""

# IGDB Service - API integration and data processing
from .igdb_service import (
    IGDB_GAME_FIELDS,
    EXCLUDED_GAME_TYPES,
    GAME_STATUS_MAPPING,
    GAME_TYPE_MAPPING,
    fetch_from_igdb,
    fetch_time_to_beat,
    meets_quality_requirements,
    process_similar_games,
    process_igdb_data,
)

# Game Service - CRUD and sync operations
from .game_service import (
    get_game_by_id,
    get_game_by_igdb_id,
    get_game_by_slug,
    create_game,
    update_game,
    mark_game_as_deleted,
    get_games_by_ids,
    get_recent_games,
    get_all_games,
    get_all_games_count,
    sync_games_from_igdb,
    sync_similar_games,
    fetch_related_game_types,
    fetch_game_editions_and_bundles,
)

# Discovery Service - Game collections
from .discovery_service import (
    get_trending_games,
    get_anticipated_games,
    get_highly_rated_games,
    get_latest_games,
    get_games_by_genre,
    count_games_by_genre,
    get_games_by_theme,
    count_games_by_theme,
    get_genre_id_by_slug,
    get_theme_id_by_slug,
)

# SWR Service - Data freshness
from .swr_service import (
    is_stale,
    refresh_game_async,
)

# Search Service - Game search
from .search_service import (
    string_similarity,
    search_games_in_db,
    count_search_results,
)

# Re-export all for backward compatibility
__all__ = [
    # IGDB Service
    "IGDB_GAME_FIELDS",
    "EXCLUDED_GAME_TYPES",
    "GAME_STATUS_MAPPING",
    "GAME_TYPE_MAPPING",
    "fetch_from_igdb",
    "fetch_time_to_beat",
    "meets_quality_requirements",
    "process_similar_games",
    "process_igdb_data",
    # Game Service
    "get_game_by_id",
    "get_game_by_igdb_id",
    "get_game_by_slug",
    "create_game",
    "update_game",
    "mark_game_as_deleted",
    "get_games_by_ids",
    "get_recent_games",
    "get_all_games",
    "get_all_games_count",
    "sync_games_from_igdb",
    "sync_similar_games",
    "fetch_related_game_types",
    "fetch_game_editions_and_bundles",
    # Discovery Service
    "get_trending_games",
    "get_anticipated_games",
    "get_highly_rated_games",
    "get_latest_games",
    "get_games_by_genre",
    "count_games_by_genre",
    "get_games_by_theme",
    "count_games_by_theme",
    "get_genre_id_by_slug",
    "get_theme_id_by_slug",
    # SWR Service
    "is_stale",
    "refresh_game_async",
    # Search Service
    "string_similarity",
    "search_games_in_db",
    "count_search_results",
]
