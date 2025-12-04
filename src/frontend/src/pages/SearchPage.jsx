import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchGames } from "../api";
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

// Number of games to display per page
const GAMES_PER_PAGE = 48;

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get search query and category from URL
  const query = searchParams.get("query") || "";
  const category = searchParams.get("category") || "all";
  
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [sortOption, setSortOption] = useState("relevance");
  const [genreFilters, setGenreFilters] = useState([]);
  const [themeFilters, setThemeFilters] = useState([]);
  const [platformFilters, setPlatformFilters] = useState([]);
  const [gameModeFilters, setGameModeFilters] = useState([]);
  const [perspectiveFilters, setPerspectiveFilters] = useState([]);
  const [minRatingFilter, setMinRatingFilter] = useState(0);
  const [contentTypeFilters, setContentTypeFilters] = useState([]);
  
  // For new search
  const [searchQuery, setSearchQuery] = useState("");
  
  // For filtering existing results
  const [titleFilterQuery, setTitleFilterQuery] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(window.innerWidth >= 1024);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryButtonRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  
  // For pagination
  const [currentPage, setCurrentPage] = useState(0);

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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [genreFilters, themeFilters, platformFilters, gameModeFilters, perspectiveFilters, contentTypeFilters, minRatingFilter, titleFilterQuery]);

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
    setSearchParams({ query, category: categoryId });
    setCategoryDropdownOpen(false);
  };

  // Fetch search results when component mounts or query changes
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Request all results for the search page without limiting
        const startTime = Date.now();
        const results = await searchGames(query, category, 9999);
        
        // Add a slight delay for the skeleton loader to show if the response is too fast
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 300) {
          await new Promise(resolve => setTimeout(resolve, 300 - elapsedTime));
        }
        
        // Use the utility function to normalize game data
        const normalizedResults = normalizeGamesData(results);
        
        // Add index property to preserve original order for relevance sorting
        const resultsWithIndex = normalizedResults.map((game, index) => ({
          ...game,
          originalIndex: index
        }));
        
        setSearchResults(resultsWithIndex || []);
      } catch (error) {
        console.error("Error searching games:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
    // Reset to first page when query changes
    setCurrentPage(0);
  }, [query, category]);

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
      setGenreFilters([]);
      setThemeFilters([]);
      setPlatformFilters([]);
      setGameModeFilters([]);
      setPerspectiveFilters([]);
      setContentTypeFilters([]);
      setMinRatingFilter(0);
      
      setSearchParams({ query: searchQuery, category });
      
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
          .map(p => p.replace("PC (Microsoft Windows)", "PC")
                    .replace("PlayStation 5", "PS5")
                    .replace("PlayStation 4", "PS4")
                    .replace("Nintendo Switch", "Switch")
                    .replace("PlayStation 3", "PS3")
                    .replace("PlayStation 2", "PS2"))
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
      const matchesContentType = contentTypeFilters.length === 0 || 
        (game.game_type_name && (
          contentTypeFilters.includes(game.game_type_name) ||
          (game.game_type_name === "Main Game" && contentTypeFilters.includes("Base Game"))
        ));
      
      // Apply all other filters
      const passesOtherFilters = gamePassesAllFilters(game, {
        genres: genreFilters,
        themes: themeFilters,
        platforms: platformFilters,
        gameModes: gameModeFilters,
        playerPerspectives: perspectiveFilters,
        minRating: minRatingFilter
      });
      
      return matchesTitle && matchesContentType && passesOtherFilters;
    });
  }, [searchResults, titleFilterQuery, contentTypeFilters, genreFilters, themeFilters, platformFilters, gameModeFilters, perspectiveFilters, minRatingFilter]);

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
  
  // Get paginated games
  const paginatedGames = useMemo(() => {
    const startIndex = currentPage * GAMES_PER_PAGE;
    return sortedGames.slice(startIndex, startIndex + GAMES_PER_PAGE);
  }, [sortedGames, currentPage]);
  
  // Calculate total pages
  const totalPages = Math.ceil(sortedGames.length / GAMES_PER_PAGE);
  
  // Page navigation handlers
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Filter handlers
  const handleFilterChange = (filters) => {
    setGenreFilters(filters.genres || []);
    setThemeFilters(filters.themes || []);
    setPlatformFilters(filters.platforms || []);
    setGameModeFilters(filters.gameModes || []);
    setPerspectiveFilters(filters.playerPerspectives || []);
    setContentTypeFilters(filters.contentTypes || []);
    setMinRatingFilter(filters.minRating || 0);
  };

  const handleRemoveGenre = (genre) => {
    setGenreFilters(prev => prev.filter(g => g !== genre));
  };

  const handleRemoveTheme = (theme) => {
    setThemeFilters(prev => prev.filter(t => t !== theme));
  };

  const handleRemovePlatform = (platform) => {
    setPlatformFilters(prev => prev.filter(p => p !== platform));
  };

  const handleRemoveGameMode = (mode) => {
    setGameModeFilters(prev => prev.filter(m => m !== mode));
  };

  const handleRemovePerspective = (perspective) => {
    setPerspectiveFilters(prev => prev.filter(p => p !== perspective));
  };

  const handleRemoveContentType = (contentType) => {
    setContentTypeFilters(prev => prev.filter(ct => ct !== contentType));
  };

  const handleRemoveRating = () => {
    setMinRatingFilter(0);
  };

  const handleClearAllFilters = () => {
    setTitleFilterQuery("");
    setGenreFilters([]);
    setThemeFilters([]);
    setPlatformFilters([]);
    setGameModeFilters([]);
    setPerspectiveFilters([]);
    setContentTypeFilters([]);
    setMinRatingFilter(0);
  };

  // Build the category name based on the search parameters
  const getCategoryName = () => {
    switch(category) {
      case "games": return "Game Titles";
      case "developers": return "Developers";
      case "platforms": return "Platforms";
      case "keywords": return "Keywords";
      default: return "All";
    }
  };

  const hasActiveFilters = titleFilterQuery || 
                         genreFilters.length > 0 || 
                         themeFilters.length > 0 || 
                         platformFilters.length > 0 || 
                         gameModeFilters.length > 0 || 
                         perspectiveFilters.length > 0 || 
                         contentTypeFilters.length > 0 ||
                         minRatingFilter > 0;

  return (
    <div className="min-h-screen bg-black pb-12">
      <div className="container mx-auto px-4 pt-20 pb-4">
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
                <span className="font-semibold text-primary mr-1">Found:</span>
                <span>{searchResults.length} games</span>
              </div>
              
              {filteredGames.length !== searchResults.length && (
                <div className="flex items-center bg-surface/30 px-3 py-1 rounded-full">
                  <span className="font-semibold text-primary mr-1">Showing:</span>
                  <span>{filteredGames.length} after filtering</span>
                </div>
              )}
              
              {totalPages > 1 && (
                <div className="flex items-center bg-surface/30 px-3 py-1 rounded-full">
                  <span className="font-semibold text-primary mr-1">Page:</span>
                  <span>{currentPage + 1} of {totalPages}</span>
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
                activeGenres={genreFilters}
                activeThemes={themeFilters}
                activePlatforms={platformFilters}
                activeGameModes={gameModeFilters}
                activePlayerPerspectives={perspectiveFilters}
                activeContentTypes={contentTypeFilters}
                minRating={minRatingFilter}
                titleFilter={titleFilterQuery}
                onFilterChange={handleFilterChange}
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
                        placeholder="New search..."
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
                        className="lg:hidden flex items-center gap-1 bg-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <Filter size={16} />
                        <span>Filters</span>
                      </button>

                      {/* Sort Dropdown */}
                      <SortDropdown
                        sortOption={sortOption}
                        onSortChange={setSortOption}
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
                  genreFilters={genreFilters}
                  themeFilters={themeFilters}
                  platformFilters={platformFilters}
                  gameModeFilters={gameModeFilters}
                  perspectiveFilters={perspectiveFilters}
                  contentTypeFilters={contentTypeFilters}
                  minRating={minRatingFilter}
                  onRemoveGenre={handleRemoveGenre}
                  onRemoveTheme={handleRemoveTheme}
                  onRemovePlatform={handleRemovePlatform}
                  onRemoveGameMode={handleRemoveGameMode}
                  onRemovePerspective={handleRemovePerspective}
                  onRemoveContentType={handleRemoveContentType}
                  onRemoveRating={handleRemoveRating}
                  onClearAll={handleClearAllFilters}
                />
              </div>
              
              {/* Games Display */}
              <div className="p-5">
                {loading ? (
                  viewMode === "grid" ? (
                    <GamesGrid games={[]} loading={true} />
                  ) : (
                    <GamesList games={[]} loading={true} />
                  )
                ) : paginatedGames.length > 0 ? (
                  <>
                    {viewMode === "grid" ? (
                      <GamesGrid games={paginatedGames} loading={false} />
                    ) : (
                      <GamesList games={paginatedGames} loading={false} />
                    )}
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-8 flex items-center justify-center">
                        <div className="bg-surface-dark/60 backdrop-blur-sm border border-gray-800/30 rounded-lg p-1.5 flex items-center gap-1.5">
                          <button
                            onClick={goToPrevPage}
                            disabled={currentPage === 0}
                            className={`rounded-md px-2.5 py-1.5 flex items-center justify-center transition-colors ${
                              currentPage === 0
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer'
                            }`}
                            aria-label="Previous page"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          
                          <div className="flex gap-1">
                            {Array.from({ length: Math.min(totalPages, 7) }).map((_, index) => {
                              // For pagination with many pages, add ellipsis
                              let pageToShow = index;
                              
                              if (totalPages > 7) {
                                // Complex pagination logic for many pages
                                if (currentPage < 4) {
                                  // Near start: show first 5 pages, ellipsis, last page
                                  if (index < 5) {
                                    pageToShow = index;
                                  } else if (index === 5) {
                                    return (
                                      <span key="ellipsis-end" className="flex items-center justify-center w-8 text-gray-500">
                                        …
                                      </span>
                                    );
                                  } else {
                                    pageToShow = totalPages - 1;
                                  }
                                } else if (currentPage > totalPages - 5) {
                                  // Near end: show first page, ellipsis, last 5 pages
                                  if (index === 0) {
                                    pageToShow = 0;
                                  } else if (index === 1) {
                                    return (
                                      <span key="ellipsis-start" className="flex items-center justify-center w-8 text-gray-500">
                                        …
                                      </span>
                                    );
                                  } else {
                                    pageToShow = totalPages - (7 - index);
                                  }
                                } else {
                                  // Middle: show first page, ellipsis, current page and neighbors, ellipsis, last page
                                  if (index === 0) {
                                    pageToShow = 0;
                                  } else if (index === 1) {
                                    return (
                                      <span key="ellipsis-start" className="flex items-center justify-center w-8 text-gray-500">
                                        …
                                      </span>
                                    );
                                  } else if (index === 6) {
                                    pageToShow = totalPages - 1;
                                  } else if (index === 5) {
                                    return (
                                      <span key="ellipsis-end" className="flex items-center justify-center w-8 text-gray-500">
                                        …
                                      </span>
                                    );
                                  } else {
                                    pageToShow = currentPage + (index - 3);
                                  }
                                }
                              }
                                
                              return (
                                <button
                                  key={pageToShow}
                                  onClick={() => {
                                    setCurrentPage(pageToShow);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className={`h-8 w-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                                    currentPage === pageToShow
                                      ? 'bg-primary text-dark'
                                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                  }`}
                                  aria-label={`Page ${pageToShow + 1}`}
                                  aria-current={currentPage === pageToShow ? 'page' : undefined}
                                >
                                  {pageToShow + 1}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={goToNextPage}
                            disabled={currentPage >= totalPages - 1}
                            className={`rounded-md px-2.5 py-1.5 flex items-center justify-center transition-colors ${
                              currentPage >= totalPages - 1
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer'
                            }`}
                            aria-label="Next page"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
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