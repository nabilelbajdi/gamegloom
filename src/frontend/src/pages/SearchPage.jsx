import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchGames, searchCount } from "../api";
import GamesGrid from "../components/discover/GamesGrid";
import GamesList from "../components/common/GamesList";
import FilterDropdown from "../components/common/FilterDropdown";
import FilterPanel from "../components/common/FilterPanel";
import SortDropdown from "../components/common/SortDropdown";
import ViewToggle from "../components/common/ViewToggle";
import ActiveFilters from "../components/common/ActiveFilters";
import ScrollToTop from "../components/common/ScrollToTop";
import { gamePassesAllFilters } from "../utils/filterUtils";
import { normalizeGamesData, formatRating } from "../utils/gameUtils";
import { Search, X, Filter, Info, ChevronDown, Gamepad2, Users, Monitor, ChevronLeft, ChevronRight, Tags } from "lucide-react";
import PageMeta from "../components/common/PageMeta";
import ErrorState from "../components/common/ErrorState";
import { readFunctional, writeFunctional } from "../utils/consent";
import { shortenPlatform } from "../utils/gameDisplay";
import useFilterParams from "../hooks/useFilterParams";

// Number of games to display per page
const GAMES_PER_PAGE = 48;

// Filter and sort keys persisted in the URL for this page
const SEARCH_FILTER_SCHEMA = {
  filters: ["genres", "themes", "platforms", "gameModes", "playerPerspectives", "contentTypes", "minRating"],
  sort: { values: ["relevance", "exact_match", "rating_high", "release_new", "name_asc"], default: "relevance" },
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get search query and category from URL
  const query = searchParams.get("query") || "";
  const category = searchParams.get("category") || "all";

  const [loading, setLoading] = useState(true);
  const [searchStatus, setSearchStatus] = useState("success");
  const [retryCount, setRetryCount] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [viewMode, setViewMode] = useState(() => readFunctional("searchViewMode") || "grid");
  const { filters, sortOption, applyFilters, setSort, clearAll } = useFilterParams(SEARCH_FILTER_SCHEMA);

  // Persist view mode preference (no-op if user hasn't accepted cookie consent)
  useEffect(() => {
    writeFunctional("searchViewMode", viewMode);
  }, [viewMode]);

  // For new search
  const [searchQuery, setSearchQuery] = useState("");

  // For filtering existing results
  const [titleFilterQuery, setTitleFilterQuery] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(window.innerWidth >= 1024);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryButtonRef = useRef(null);
  const categoryDropdownRef = useRef(null);

  // For pagination
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search categories
  const SEARCH_CATEGORIES = [
    { id: "all", label: "All", icon: Search },
    { id: "games", label: "Titles", icon: Gamepad2 },
    { id: "developers", label: "Developers", icon: Users },
    { id: "platforms", label: "Platforms", icon: Monitor },
    { id: "keywords", label: "Keywords", icon: Tags }
  ];

  useEffect(() => {
    const handleResize = () => {
      setShowFilterPanel(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle click outside for category dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoryDropdownOpen &&
        categoryButtonRef.current &&
        categoryDropdownRef.current &&
        !categoryButtonRef.current.contains(event.target) &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setCategoryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [categoryDropdownOpen]);

  // Toggle dropdown
  const toggleCategoryDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCategoryDropdownOpen(!categoryDropdownOpen);
  };

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("query", query);
      next.set("category", categoryId);
      return next;
    });
    setCategoryDropdownOpen(false);
  };

  // Fetch search results when component mounts or query changes
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setSearchResults([]);
        setLoading(false);
        setTotalCount(0);
        return;
      }

      setLoading(true);
      setSearchStatus("loading");
      setHasMore(true);
      try {
        // Fetch first batch and total count in parallel
        const startTime = Date.now();
        const [results, count] = await Promise.all([
          searchGames(query, category, 50, 0),
          searchCount(query, category)
        ]);

        // Add a slight delay for the skeleton loader to show if the response is too fast
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 300) {
          await new Promise(resolve => setTimeout(resolve, 300 - elapsedTime));
        }

        // Add index property to preserve original order for relevance sorting
        const resultsWithIndex = results.map((game, index) => ({
          ...game,
          originalIndex: index
        }));

        setSearchResults(resultsWithIndex || []);
        setTotalCount(count);
        setHasMore(results.length >= 50 && results.length < count);
        setSearchStatus("success");
      } catch (error) {
        console.error("Error searching games:", error);
        setSearchResults([]);
        setTotalCount(0);
        setSearchStatus("error");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, category, retryCount]);

  // Load more results
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const newResults = await searchGames(query, category, 50, searchResults.length);

      const newResultsWithIndex = newResults.map((game, index) => ({
        ...game,
        originalIndex: searchResults.length + index
      }));

      setSearchResults(prev => [...prev, ...newResultsWithIndex]);
      setHasMore(newResults.length >= 50 && searchResults.length + newResults.length < totalCount);
    } catch (error) {
      console.error("Error loading more games:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle search input changes
  const handleSearchInput = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search form submission (new search)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Clear filters when performing a new search
      setTitleFilterQuery("");
      clearAll();

      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("query", searchQuery);
        next.set("category", category);
        return next;
      });

      // Clear the search input after submitting
      setSearchQuery("");
    }
  };

  // Handle title filter input changes
  const handleTitleFilterInput = (e) => {
    setTitleFilterQuery(e.target.value);
  };

  // Clear title filter
  const clearTitleFilter = () => {
    setTitleFilterQuery("");
  };

  // Extract all unique genres, themes, platforms, game modes, and player perspectives from games
  const extractFilterOptions = () => {
    const allGenres = [...new Set(searchResults
      .filter(game => game.genres)
      .flatMap(game => {
        let genres = typeof game.genres === 'string'
          ? game.genres.split(',').map(g => g.trim())
          : game.genres;
        return genres;
      })
    )].sort();

    const allThemes = [...new Set(searchResults
      .filter(game => game.themes)
      .flatMap(game => typeof game.themes === 'string'
        ? game.themes.split(',').map(t => t.trim())
        : game.themes)
    )].sort();

    const allPlatforms = [...new Set(searchResults
      .filter(game => game.platforms)
      .flatMap(game => typeof game.platforms === 'string'
        ? game.platforms.split(',').map(p => p.trim())
          .map(shortenPlatform)
        : game.platforms)
    )].sort();

    const allGameModes = [...new Set(searchResults
      .filter(game => game.gameModes || game.game_modes)
      .flatMap(game => {
        const modes = game.gameModes || game.game_modes;
        return typeof modes === 'string'
          ? modes.split(',').map(m => m.trim())
          : modes;
      })
    )].sort();

    const allPlayerPerspectives = [...new Set(searchResults
      .filter(game => game.playerPerspectives || game.player_perspectives)
      .flatMap(game => {
        const perspectives = game.playerPerspectives || game.player_perspectives;
        return typeof perspectives === 'string'
          ? perspectives.split(',').map(p => p.trim())
          : perspectives;
      })
    )].sort();

    const allContentTypes = [...new Set(searchResults
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

  // Filter games based on all filters
  const filteredGames = useMemo(() => {
    return searchResults.filter(game => {
      // Title filter
      const matchesTitle = !titleFilterQuery ||
        game.name.toLowerCase().includes(titleFilterQuery.toLowerCase());

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

      return matchesTitle && matchesContentType && passesOtherFilters;
    });
  }, [searchResults, titleFilterQuery, filters]);

  // Sort games
  const sortedGames = useMemo(() => {
    // Get the query for exact matching
    const searchQuery = query.toLowerCase().trim();

    return [...filteredGames].sort((a, b) => {
      switch (sortOption) {
        case "exact_match":
          // First check for exact title matches
          const aExactMatch = a.name.toLowerCase() === searchQuery;
          const bExactMatch = b.name.toLowerCase() === searchQuery;

          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;

          // Then check for titles starting with the search query
          const aStartsWithMatch = a.name.toLowerCase().startsWith(searchQuery);
          const bStartsWithMatch = b.name.toLowerCase().startsWith(searchQuery);

          if (aStartsWithMatch && !bStartsWithMatch) return -1;
          if (!aStartsWithMatch && bStartsWithMatch) return 1;

          // Fall back to relevance order
          return a.originalIndex - b.originalIndex;

        case "relevance":
          return a.originalIndex - b.originalIndex;
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
        case "added_old":
          return new Date(a.added_at || 0) - new Date(b.added_at || 0);
        default:
          // Default to relevance (original order from search result)
          return a.originalIndex - b.originalIndex;
      }
    });
  }, [filteredGames, sortOption, query]);

  // Clear all filters and reset the ephemeral title filter
  const handleClearAllFilters = () => {
    setTitleFilterQuery("");
    clearAll();
  };

  // Build the category name based on the search parameters
  const getCategoryName = () => {
    switch (category) {
      case "games": return "Game Titles";
      case "developers": return "Developers";
      case "platforms": return "Platforms";
      case "keywords": return "Keywords";
      default: return "All";
    }
  };

  const hasActiveFilters = titleFilterQuery ||
    filters.genres.length > 0 ||
    filters.themes.length > 0 ||
    filters.platforms.length > 0 ||
    filters.gameModes.length > 0 ||
    filters.playerPerspectives.length > 0 ||
    filters.contentTypes.length > 0 ||
    filters.minRating > 0;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-12">
      <PageMeta title={query ? `Search: ${query}` : "Search Games"} />
      <div className="container mx-auto px-4 pt-4 md:pt-20 pb-4">
        {/* Integrated Header */}
        <div className="mb-6 px-1">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-white">
                Search Results for "<span className="text-primary">{query}</span>"
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-400 text-sm mt-1">
              <div className="flex items-center bg-surface/30 px-3 py-1 rounded-full">
                <span className="font-semibold text-primary mr-1">Category:</span>
                <span>{getCategoryName()}</span>
              </div>

              <div className="flex items-center bg-surface/30 px-3 py-1 rounded-full">
                <span className="font-semibold text-primary mr-1">Showing:</span>
                <span>{searchResults.length} of {totalCount.toLocaleString()} games</span>
              </div>

              {filteredGames.length !== searchResults.length && (
                <div className="flex items-center bg-surface/30 px-3 py-1 rounded-full">
                  <span className="font-semibold text-primary mr-1">Filtered:</span>
                  <span>{filteredGames.length} games</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Filter Panel */}
          {showFilterPanel && (
            <div className="w-full lg:w-64 xl:w-72 order-2 lg:order-1">
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
                titleFilter={titleFilterQuery}
                onFilterChange={applyFilters}
                onTitleFilterChange={(value) => setTitleFilterQuery(value)}
              />
            </div>
          )}

          {/* Right Column - Filters and Games */}
          <div className="flex-1 order-1 lg:order-2">
            {/* Filter Controls and Games Card */}
            <div className="bg-surface-dark/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-800/30 overflow-hidden">
              <div className="p-4 border-b border-gray-800/30">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  {/* New Search Form */}
                  <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto order-2 sm:order-1">
                    <div className="relative" ref={categoryButtonRef}>
                      <button
                        type="button"
                        className="bg-zinc-800 text-xs font-semibold text-gray-400 rounded-md px-3 py-2.5 focus:outline-none border-none shadow-sm cursor-pointer hover:text-white transition-colors flex items-center"
                        onClick={toggleCategoryDropdown}
                        aria-haspopup="true"
                        aria-expanded={categoryDropdownOpen}
                      >
                        {SEARCH_CATEGORIES.find(c => c.id === category)?.label}
                        <ChevronDown
                          size={14}
                          className={`ml-1.5 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* Category Dropdown */}
                      {categoryDropdownOpen && (
                        <div
                          ref={categoryDropdownRef}
                          className="absolute top-full left-0 mt-1 w-36 z-[60] rounded-md shadow-lg bg-surface-dark border border-gray-800/50 overflow-hidden"
                          role="menu"
                        >
                          <div className="py-1.5">
                            {SEARCH_CATEGORIES.map(cat => {
                              const IconComponent = cat.icon;
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  className="block w-full text-left px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200 my-0.5 cursor-pointer"
                                  onClick={() => handleCategorySelect(cat.id)}
                                  role="menuitem"
                                >
                                  <div className="flex items-center gap-2">
                                    <IconComponent size={14} className="text-gray-400" />
                                    {cat.label}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="relative w-full sm:w-auto">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search size={16} className="text-primary" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchInput}
                        autoFocus={!query}
                        placeholder="Search games..."
                        className="w-full sm:w-56 bg-zinc-800 text-sm text-white rounded-md pl-10 pr-4 py-2.5 focus:outline-none border-none shadow-sm h-[38px]"
                        aria-label="Enter a new search term"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-zinc-800 text-primary hover:bg-black/10 text-sm font-semibold rounded-md px-4 py-2.5 transition-colors shadow-sm cursor-pointer h-[38px]"
                    >
                      Search
                    </button>
                  </form>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end order-1 sm:order-2">
                    <div className="flex items-center gap-2">
                      {/* Filter Toggle (Mobile/Tablet) */}
                      <button
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className="lg:hidden flex items-center gap-1 bg-gray-800 rounded-lg px-2.5 py-2 sm:px-3 sm:py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        aria-label="Filters"
                      >
                        <Filter size={16} />
                        <span className="hidden sm:inline">Filters</span>
                      </button>

                      {/* Sort Dropdown */}
                      <SortDropdown
                        sortOption={sortOption}
                        onSortChange={setSort}
                        isSearchPage={true}
                      />

                      {/* View Toggle */}
                      <ViewToggle
                        viewMode={viewMode}
                        onViewChange={setViewMode}
                      />
                    </div>
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
                  onClearAll={handleClearAllFilters}
                />
              </div>

              {/* Games Display */}
              <div className="p-5">
                {searchStatus === "error" ? (
                  <ErrorState
                    message="Search failed. Please try again."
                    onRetry={() => setRetryCount(c => c + 1)}
                  />
                ) : loading ? (
                  viewMode === "grid" ? (
                    <GamesGrid games={[]} loading={true} />
                  ) : (
                    <GamesList games={[]} loading={true} />
                  )
                ) : sortedGames.length > 0 ? (
                  <>
                    {viewMode === "grid" ? (
                      <GamesGrid games={sortedGames} loading={false} />
                    ) : (
                      <GamesList games={sortedGames} loading={false} />
                    )}

                    {/* Load More / All Loaded */}
                    <div className="mt-8 flex flex-col items-center justify-center gap-2">
                      {hasMore ? (
                        <>
                          <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="text-primary/70 hover:text-primary text-sm transition-colors hover:underline cursor-pointer disabled:opacity-50"
                          >
                            {loadingMore ? "Loading..." : "Load more games"}
                          </button>
                        </>
                      ) : (
                        <span className="text-light/50 text-sm">
                          Showing all {searchResults.length.toLocaleString()} games
                        </span>
                      )}
                    </div>
                  </>
                ) : !query ? (
                  <div className="text-center py-12">
                    <Search size={36} className="text-gray-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Search thousands of games</h3>
                    <p className="text-gray-500 text-sm">Type a title in the search box above to get started.</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">
                      {searchResults.length > 0
                        ? "No results match your filters"
                        : "No search results found"}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {searchResults.length > 0
                        ? "Try adjusting or clearing your filters"
                        : "Try different search terms"}
                    </p>
                    {hasActiveFilters && searchResults.length > 0 && (
                      <button
                        onClick={handleClearAllFilters}
                        className="mt-4 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                )}
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

export default SearchPage; 