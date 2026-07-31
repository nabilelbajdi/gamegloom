import React, { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import useGameStore from "../../store/useGameStore";
import { fetchGameCount } from "../../api";
import CategoryHeader from "../../components/discover/CategoryHeader";
import GamesGrid from "../../components/discover/GamesGrid";
import GamesList from "../../components/common/GamesList";
import FilterDropdown from "../../components/common/FilterDropdown";
import FilterPanel from "../../components/common/FilterPanel";
import SortDropdown from "../../components/common/SortDropdown";
import ViewToggle from "../../components/common/ViewToggle";
import ActiveFilters from "../../components/common/ActiveFilters";
import ScrollToTop from "../../components/common/ScrollToTop";
import { gamePassesAllFilters } from "../../utils/filterUtils";
import { readFunctional, writeFunctional } from "../../utils/consent";
import { shortenPlatform } from "../../utils/gameDisplay";
import useFilterParams from "../../hooks/useFilterParams";

// Filter and sort keys persisted in the URL for this page
const DISCOVER_FILTER_SCHEMA = {
  filters: ["genres", "themes", "platforms", "gameModes", "playerPerspectives", "contentTypes", "minRating"],
  sort: { values: ["rating_high", "release_new", "name_asc"], default: "rating_high" },
};

const GameCategoryPage = ({
  title,
  categoryType,
  description = "",
  genreFilter = null,
  themeFilter = null
}) => {
  const {
    fetchGames,
    loadMoreGames,
    trendingGames,
    anticipatedGames,
    highlyRatedGames,
    latestGames,
    genreGames,
    themeGames,
    categoryStatus
  } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState(() => readFunctional("categoryViewMode") || "grid");
  const { filters, sortOption, applyFilters, setSort, clearAll } = useFilterParams(DISCOVER_FILTER_SCHEMA);

  // Persist preferences (no-op if user hasn't accepted cookie consent)
  useEffect(() => {
    writeFunctional("categoryViewMode", viewMode);
  }, [viewMode]);

  const getGamesForCategory = () => {
    switch (categoryType) {
      case "trending": return trendingGames;
      case "anticipated": return anticipatedGames;
      case "highlyRated": return highlyRatedGames;
      case "latest": return latestGames;
      case "genre": return genreFilter ? (genreGames[genreFilter] || []) : [];
      case "theme": return themeFilter ? (themeGames[themeFilter] || []) : [];
      default: return [];
    }
  };

  useEffect(() => {
    const loadGames = async () => {
      setLoading(true);
      setHasMore(true);

      // Fetch total count for genre/theme pages
      if ((categoryType === "genre" || categoryType === "theme") && (genreFilter || themeFilter)) {
        const filter = genreFilter || themeFilter;
        const count = await fetchGameCount(categoryType, filter);
        setTotalCount(count);
      }

      if (categoryType === "genre" && genreFilter) {
        await fetchGames(categoryType, genreFilter);
      } else if (categoryType === "theme" && themeFilter) {
        await fetchGames(categoryType, themeFilter);
      } else {
        await fetchGames(categoryType);
      }
      setLoading(false);
    };

    loadGames();
  }, [categoryType, fetchGames, genreFilter, themeFilter]);

  const games = getGamesForCategory();

  // Preserve default ordering
  const gamesWithIndex = games.map((game, index) => ({
    ...game,
    originalIndex: index
  }));

  // Extract all unique genres, themes, platforms, game modes, and player perspectives from games
  const extractFilterOptions = () => {
    const allGenres = [...new Set(gamesWithIndex
      .filter(game => game.genres)
      .flatMap(game => {
        let genres = typeof game.genres === 'string'
          ? game.genres.split(',').map(g => g.trim())
          : game.genres;
        return genres;
      })
    )].sort();

    const allThemes = [...new Set(gamesWithIndex
      .filter(game => game.themes)
      .flatMap(game => typeof game.themes === 'string'
        ? game.themes.split(',').map(t => t.trim())
        : game.themes)
    )].sort();

    const allPlatforms = [...new Set(gamesWithIndex
      .filter(game => game.platforms)
      .flatMap(game => typeof game.platforms === 'string'
        ? game.platforms.split(',').map(p => p.trim())
          .map(shortenPlatform)
        : game.platforms)
    )].sort();

    const allGameModes = [...new Set(gamesWithIndex
      .filter(game => game.gameModes || game.game_modes)
      .flatMap(game => {
        const modes = game.gameModes || game.game_modes;
        return typeof modes === 'string'
          ? modes.split(',').map(m => m.trim())
          : modes;
      })
    )].sort();

    const allPlayerPerspectives = [...new Set(gamesWithIndex
      .filter(game => game.playerPerspectives || game.player_perspectives)
      .flatMap(game => {
        const perspectives = game.playerPerspectives || game.player_perspectives;
        return typeof perspectives === 'string'
          ? perspectives.split(',').map(p => p.trim())
          : perspectives;
      })
    )].sort();

    const allContentTypes = [...new Set(gamesWithIndex
      .filter(game => game.game_type_name)
      .map(game => {
        if (game.game_type_name === "Main Game") {
          return "Base Game";
        }
        return game.game_type_name;
      })
    )].sort();

    return { allGenres, allThemes, allPlatforms, allGameModes, allPlayerPerspectives, allContentTypes };
  };

  const { allGenres, allThemes, allPlatforms, allGameModes, allPlayerPerspectives, allContentTypes } = extractFilterOptions();

  // Filter games based on search query, genres, themes, platforms, game modes, player perspectives, and minimum rating
  const filterGames = () => {
    return gamesWithIndex.filter(game => {
      // Search filter
      const matchesSearch = !searchQuery ||
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (game.description && game.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Content type filter
      const matchesContentType = filters.contentTypes.length === 0 ||
        (game.game_type_name && (
          filters.contentTypes.includes(game.game_type_name) ||
          (game.game_type_name === "Main Game" && filters.contentTypes.includes("Base Game"))
        ));

      // Apply all other filters
      const passesOtherFilters = gamePassesAllFilters(game, {
        genres: filters.genres,
        themes: filters.themes,
        platforms: filters.platforms,
        gameModes: filters.gameModes,
        playerPerspectives: filters.playerPerspectives,
        minRating: filters.minRating
      });

      return matchesSearch && matchesContentType && passesOtherFilters;
    });
  };

  // Sort games
  const sortGames = (filteredGames) => {
    return [...filteredGames].sort((a, b) => {
      switch (sortOption) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "rating_high":
          return (b.rating === "N/A" ? -1 : b.rating) - (a.rating === "N/A" ? -1 : a.rating);
        case "rating_low":
          return (a.rating === "N/A" ? -1 : a.rating) - (b.rating === "N/A" ? -1 : b.rating);
        case "release_new":
          return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
        case "release_old":
          return new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0);
        case "added_new":
          return new Date(b.added_at || 0) - new Date(a.added_at || 0);
        default:
          return a.originalIndex - b.originalIndex;
      }
    });
  };

  const filteredGames = filterGames();
  const sortedGames = sortGames(filteredGames);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const filter = genreFilter || themeFilter;
    const currentCount = games.length;
    const loadedCount = await loadMoreGames(categoryType, filter, currentCount);
    if (loadedCount < 50) setHasMore(false);
    setLoadingMore(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <PageMeta title={title} description={description} />
      {/* Header Section */}
      <CategoryHeader
        title={title}
        description={description}
      />

      {/* Main Content Area */}
      <div className="flex-1 bg-[var(--bg-base)] pb-12">
        <div className="container mx-auto px-4 -mt-8">
          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Filter Panel */}
            <div className="w-full lg:w-64 xl:w-72 hidden lg:block">
              <FilterPanel
                allGenres={allGenres}
                allThemes={allThemes}
                allPlatforms={allPlatforms}
                allGameModes={allGameModes}
                allPlayerPerspectives={allPlayerPerspectives}
                allContentTypes={allContentTypes}
                activeGenres={filters.genres}
                activeThemes={filters.themes}
                activePlatforms={filters.platforms}
                activeGameModes={filters.gameModes}
                activePlayerPerspectives={filters.playerPerspectives}
                activeContentTypes={filters.contentTypes}
                minRating={filters.minRating}
                titleFilter={searchQuery}
                onFilterChange={applyFilters}
                onTitleFilterChange={(value) => setSearchQuery(value)}
              />
            </div>

            {/* Right Column - Games */}
            <div className="flex-1">
              <div className="bg-surface-dark/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-800/30 overflow-hidden">
                <div className="p-4 border-b border-gray-800/30">
                  {/* Controls Section */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {/* Games Count */}
                    <div className="flex items-center gap-3 order-1 sm:order-none">
                      <div className="text-light/70 text-sm">
                        {(categoryType === "genre" || categoryType === "theme") && totalCount > 0 ? (
                          <><span className="font-semibold text-light">{sortedGames.length}</span> of {totalCount.toLocaleString()} games</>
                        ) : (
                          <><span className="font-semibold text-light">{sortedGames.length}</span> Games</>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 order-0 sm:order-none">
                      {/* Filter Dropdown - Only visible on mobile */}
                      <div className="lg:hidden">
                        <FilterDropdown
                          allGenres={allGenres}
                          allThemes={allThemes}
                          allPlatforms={allPlatforms}
                          allGameModes={allGameModes}
                          allPlayerPerspectives={allPlayerPerspectives}
                          allContentTypes={allContentTypes}
                          activeGenres={filters.genres}
                          activeThemes={filters.themes}
                          activePlatforms={filters.platforms}
                          activeGameModes={filters.gameModes}
                          activePlayerPerspectives={filters.playerPerspectives}
                          activeContentTypes={filters.contentTypes}
                          minRating={filters.minRating}
                          onFilterChange={applyFilters}
                        />
                      </div>

                      {/* Sort Dropdown */}
                      <SortDropdown
                        sortOption={sortOption}
                        onSortChange={setSort}
                        isDiscoveryPage={true}
                      />

                      {/* View Toggle */}
                      <ViewToggle
                        viewMode={viewMode}
                        onViewChange={setViewMode}
                      />
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  <ActiveFilters
                    genreFilters={filters.genres}
                    themeFilters={filters.themes}
                    platformFilters={filters.platforms}
                    gameModeFilters={filters.gameModes}
                    perspectiveFilters={filters.playerPerspectives}
                    contentTypeFilters={filters.contentTypes}
                    minRating={filters.minRating}
                    onRemoveGenre={(v) => applyFilters({ genres: filters.genres.filter((x) => x !== v) })}
                    onRemoveTheme={(v) => applyFilters({ themes: filters.themes.filter((x) => x !== v) })}
                    onRemovePlatform={(v) => applyFilters({ platforms: filters.platforms.filter((x) => x !== v) })}
                    onRemoveGameMode={(v) => applyFilters({ gameModes: filters.gameModes.filter((x) => x !== v) })}
                    onRemovePerspective={(v) => applyFilters({ playerPerspectives: filters.playerPerspectives.filter((x) => x !== v) })}
                    onRemoveContentType={(v) => applyFilters({ contentTypes: filters.contentTypes.filter((x) => x !== v) })}
                    onRemoveRating={() => applyFilters({ minRating: 0 })}
                    onClearAll={clearAll}
                  />
                </div>

                {/* Games Display */}
                <div className="p-5">
                  {(() => {
                    const filter = genreFilter || themeFilter || null;
                    const statusKey = filter ? `${categoryType}:${filter}` : categoryType;
                    const status = categoryStatus[statusKey];
                    const retryFn = () => fetchGames(categoryType, filter);
                    return viewMode === "grid" ? (
                      <GamesGrid
                        games={sortedGames}
                        loading={loading}
                        status={status}
                        onRetry={retryFn}
                      />
                    ) : (
                      <GamesList
                        games={sortedGames}
                        loading={loading}
                        status={status}
                        onRetry={retryFn}
                      />
                    );
                  })()}

                  {/* Load More - subtle text link */}
                  {(categoryType === "genre" || categoryType === "theme") && hasMore && !loading && sortedGames.length > 0 && (
                    <div className="text-center mt-6">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="text-primary/70 hover:text-primary text-sm transition-colors hover:underline disabled:opacity-50"
                      >
                        {loadingMore ? "Loading..." : "Load more games"}
                      </button>
                    </div>
                  )}

                  {/* All loaded message */}
                  {(categoryType === "genre" || categoryType === "theme") && !hasMore && sortedGames.length > 0 && (
                    <div className="text-center text-light/40 mt-6 text-xs">
                      Showing all {sortedGames.length} games
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default GameCategoryPage; 