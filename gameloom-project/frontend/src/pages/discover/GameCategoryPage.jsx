import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGameStore from "../../store/useGameStore";
import { useAuth } from "../../context/AuthContext";
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

const GameCategoryPage = ({ 
  title, 
  categoryType,
  description = "",
  genreFilter = null,
  themeFilter = null
}) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    fetchGames,
    trendingGames,
    anticipatedGames,
    highlyRatedGames,
    latestGames,
    genreGames,
    themeGames,
    recommendedGames
  } = useGameStore();
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortOption, setSortOption] = useState(categoryType === "genre" || categoryType === "theme" ? "rating_high" : "added_new");
  const [genreFilters, setGenreFilters] = useState([]);
  const [themeFilters, setThemeFilters] = useState([]);
  const [platformFilters, setPlatformFilters] = useState([]);
  const [gameModeFilters, setGameModeFilters] = useState([]);
  const [perspectiveFilters, setPerspectiveFilters] = useState([]);
  const [minRatingFilter, setMinRatingFilter] = useState(0);
  const [contentTypeFilters, setContentTypeFilters] = useState([]);

  const getGamesForCategory = () => {
    switch (categoryType) {
      case "trending": return trendingGames;
      case "anticipated": return anticipatedGames;
      case "highlyRated": return highlyRatedGames;
      case "latest": return latestGames;
      case "genre": return genreFilter ? (genreGames[genreFilter] || []) : [];
      case "theme": return themeFilter ? (themeGames[themeFilter] || []) : [];
      case "recommendations": return recommendedGames;
      default: return [];
    }
  };

  useEffect(() => {
    // Only redirect to login if auth is loaded and user is not authenticated
    if (!authLoading && categoryType === "recommendations" && !user) {
      navigate("/login");
      return;
    }

    const loadGames = async () => {
      setLoading(true);
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
  }, [categoryType, fetchGames, genreFilter, themeFilter, user, navigate, authLoading]);

  const games = getGamesForCategory();
  
  // Preserve default ordering
  const gamesWithIndex = games.map((game, index) => ({
    ...game,
    originalIndex: categoryType !== "recommendations" ? index : null
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
          .map(p => p.replace("PC (Microsoft Windows)", "PC")
                    .replace("PlayStation 5", "PS5")
                    .replace("PlayStation 4", "PS4")
                    .replace("Nintendo Switch", "Switch")
                    .replace("PlayStation 3", "PS3")
                    .replace("PlayStation 2", "PS2"))
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
  
  // Filter handlers
  const handleFilterChange = (filters) => {
    setGenreFilters(filters.genres || []);
    setThemeFilters(filters.themes || []);
    setPlatformFilters(filters.platforms || []);
    setGameModeFilters(filters.gameModes || []);
    setPerspectiveFilters(filters.playerPerspectives || []);
    setMinRatingFilter(filters.minRating || 0);
    setContentTypeFilters(filters.contentTypes || []);
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
    setGenreFilters([]);
    setThemeFilters([]);
    setPlatformFilters([]);
    setGameModeFilters([]);
    setPerspectiveFilters([]);
    setMinRatingFilter(0);
    setContentTypeFilters([]);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header Section */}
      <CategoryHeader 
        title={title} 
        description={description}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 bg-gradient-to-b from-black/95 to-black pb-12">
        <div className="container mx-auto px-4 -mt-8">
          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Games */}
            <div className="flex-1">
              {/* Card Container */}
              <div className="bg-surface-dark/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-800/30 overflow-hidden">
                <div className="p-4 border-b border-gray-800/30">
                  {/* Controls Section */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {/* Games Count */}
                    <div className="flex items-center gap-3 order-1 sm:order-none">
                      <div className="text-light/70 text-sm">
                        <span className="font-semibold text-light">{sortedGames.length}</span> Games
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
                          activeGenres={genreFilters}
                          activeThemes={themeFilters}
                          activePlatforms={platformFilters}
                          activeGameModes={gameModeFilters}
                          activePlayerPerspectives={perspectiveFilters}
                          activeContentTypes={contentTypeFilters}
                          minRating={minRatingFilter}
                          onFilterChange={handleFilterChange}
                        />
                      </div>

                      {/* Sort Dropdown */}
                      <SortDropdown
                        sortOption={sortOption}
                        onSortChange={setSortOption}
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
                  {viewMode === "grid" ? (
                    <GamesGrid
                      games={sortedGames}
                      loading={loading}
                    />
                  ) : (
                    <GamesList
                      games={sortedGames}
                      loading={loading}
                    />
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Column - Filter Panel */}
            <div className="w-full lg:w-64 xl:w-72 hidden lg:block">
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
                titleFilter={searchQuery}
                onFilterChange={handleFilterChange}
                onTitleFilterChange={(value) => setSearchQuery(value)}
              />
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