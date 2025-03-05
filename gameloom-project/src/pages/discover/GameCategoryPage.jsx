import React, { useState, useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import CategoryHeader from "../../components/discover/CategoryHeader";
import GamesGrid from "../../components/discover/GamesGrid";
import GamesList from "../../components/discover/GamesList";
import SearchInput from "../../components/discover/SearchInput";
import FilterDropdown from "../../components/discover/FilterDropdown";
import SortDropdown from "../../components/discover/SortDropdown";
import ViewToggle from "../../components/discover/ViewToggle";
import ActiveFilters from "../../components/discover/ActiveFilters";
import ScrollToTop from "../../components/discover/ScrollToTop";

const GameCategoryPage = ({ 
  title, 
  categoryType, 
  description = ""
}) => {
  const { 
    fetchGames,
    trendingGames,
    anticipatedGames,
    highlyRatedGames,
    latestGames
  } = useGameStore();
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortOption, setSortOption] = useState("default");
  const [genreFilters, setGenreFilters] = useState([]);
  const [themeFilters, setThemeFilters] = useState([]);
  const [minRatingFilter, setMinRatingFilter] = useState(0);

  const getGamesForCategory = () => {
    switch (categoryType) {
      case "trending": return trendingGames;
      case "anticipated": return anticipatedGames;
      case "highlyRated": return highlyRatedGames;
      case "latest": return latestGames;
      default: return [];
    }
  };

  useEffect(() => {
    const loadGames = async () => {
      setLoading(true);
      await fetchGames(categoryType);
      setLoading(false);
    };

    loadGames();
  }, [categoryType, fetchGames]);

  const games = getGamesForCategory();
  
  // Extract all unique genres and themes from games
  const extractGenresAndThemes = () => {
    const allGenres = [...new Set(games
      .filter(game => game.genres)
      .flatMap(game => typeof game.genres === 'string' 
        ? game.genres.split(',').map(g => g.trim())
        : game.genres)
    )].sort();
    
    const allThemes = [...new Set(games
      .filter(game => game.themes)
      .flatMap(game => typeof game.themes === 'string' 
        ? game.themes.split(',').map(t => t.trim())
        : game.themes)
    )].sort();

    return { allGenres, allThemes };
  };

  const { allGenres, allThemes } = extractGenresAndThemes();

  // Filter games based on search query, genres, themes, and minimum rating
  const filterGames = () => {
    return games.filter(game => {
      // Search filter
      const matchesSearch = !searchQuery || 
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (game.description && game.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Genre filter
      const matchesGenre = genreFilters.length === 0 || 
        (game.genres && genreFilters.some(genre => {
          if (typeof game.genres === 'string') {
            return game.genres.toLowerCase().includes(genre.toLowerCase());
          } else if (Array.isArray(game.genres)) {
            return game.genres.some(g => g.toLowerCase().includes(genre.toLowerCase()));
          }
          return false;
        }));
      
      // Theme filter
      const matchesTheme = themeFilters.length === 0 || 
        (game.themes && themeFilters.some(theme => {
          if (typeof game.themes === 'string') {
            return game.themes.toLowerCase().includes(theme.toLowerCase());
          } else if (Array.isArray(game.themes)) {
            return game.themes.some(t => t.toLowerCase().includes(theme.toLowerCase()));
          }
          return false;
        }));
      
      // Rating filter
      const gameRating = typeof game.rating === 'string' ? parseFloat(game.rating) : game.rating;
      const matchesRating = minRatingFilter === 0 || 
        (gameRating !== undefined && gameRating !== null && gameRating !== "N/A" && gameRating >= minRatingFilter);
      
      return matchesSearch && matchesGenre && matchesTheme && matchesRating;
    });
  };

  // Sort games
  const sortGames = (filteredGames) => {
    if (sortOption === 'default') {
      return filteredGames;
    }

    return [...filteredGames].sort((a, b) => {
      switch (sortOption) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "rating-high":
          return (b.rating === "N/A" ? -1 : b.rating) - (a.rating === "N/A" ? -1 : a.rating);
        case "rating-low":
          return (a.rating === "N/A" ? -1 : a.rating) - (b.rating === "N/A" ? -1 : b.rating);
        case "release-new":
          return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
        case "release-old":
          return new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0);
        default:
          return 0;
      }
    });
  };

  // Event handlers
  const handleFilterChange = (filters) => {
    setGenreFilters(filters.genres);
    setThemeFilters(filters.themes);
    setMinRatingFilter(filters.minRating || 0);
  };

  const handleRemoveGenre = (genre) => {
    setGenreFilters(prev => prev.filter(g => g !== genre));
  };

  const handleRemoveTheme = (theme) => {
    setThemeFilters(prev => prev.filter(t => t !== theme));
  };

  const handleRemoveRating = () => {
    setMinRatingFilter(0);
  };

  const handleClearAllFilters = () => {
    setGenreFilters([]);
    setThemeFilters([]);
    setMinRatingFilter(0);
  };

  // Process games through filtering and sorting
  const filteredGames = filterGames();
  const sortedGames = sortGames(filteredGames);

  return (
    <div className="min-h-screen bg-dark">
      {/* Header Section */}
      <CategoryHeader 
        title={title} 
        description={description}
      />
      
      <div className="container mx-auto px-4 py-6">
        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* Games Count */}
          <div className="text-light/70 text-sm order-1 sm:order-none">
            <span className="font-medium text-light">{sortedGames.length}</span> Games
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 order-0 sm:order-none">
            {/* Search Input */}
            <SearchInput 
              value={searchQuery}
              onChange={setSearchQuery}
            />

            {/* Filter Dropdown */}
            <FilterDropdown
              allGenres={allGenres}
              allThemes={allThemes}
              activeGenres={genreFilters}
              activeThemes={themeFilters}
              minRating={minRatingFilter}
              onFilterChange={handleFilterChange}
            />

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
          minRating={minRatingFilter}
          onRemoveGenre={handleRemoveGenre}
          onRemoveTheme={handleRemoveTheme}
          onRemoveRating={handleRemoveRating}
          onClearAll={handleClearAllFilters}
        />
        
        {/* Games Display */}
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
        
        <ScrollToTop />
      </div>
    </div>
  );
};

export default GameCategoryPage; 