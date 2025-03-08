import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useUserGameStore from "../store/useUserGameStore";
import LibraryHeader from "../components/library/LibraryHeader";
import LibraryTabs from "../components/library/LibraryTabs";
import GameLibraryGrid from "../components/library/GameLibraryGrid";
import LoadingState from "../components/library/LoadingState";
import { EmptyLibrary } from "../components/library/EmptyState";
import ScrollToTop from "../components/common/ScrollToTop";
import SearchInput from "../components/common/SearchInput";
import SortDropdown from "../components/common/SortDropdown";
import FilterDropdown from "../components/common/FilterDropdown";
import FilterPanel from "../components/common/FilterPanel";
import ViewToggle from "../components/common/ViewToggle";
import ActiveFilters from "../components/common/ActiveFilters";
import { gamePassesAllFilters } from "../utils/filterUtils";

const MyLibraryPage = () => {
  const { user, loading } = useAuth();
  const { collection, fetchCollection, isLoading } = useUserGameStore();
  
  // Component state
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [viewMode, setViewMode] = useState("grid");
  const [myLists, setMyLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  
  // Filter states
  const [genreFilters, setGenreFilters] = useState([]);
  const [themeFilters, setThemeFilters] = useState([]);
  const [platformFilters, setPlatformFilters] = useState([]);
  const [gameModeFilters, setGameModeFilters] = useState([]);
  const [perspectiveFilters, setPerspectiveFilters] = useState([]);
  const [minRatingFilter, setMinRatingFilter] = useState(0);

  // Fetch user collection on mount
  useEffect(() => {
    if (user) {
      fetchCollection();
    }
  }, [user, fetchCollection]);

  // Calculate total games count
  const totalGames = collection ? (
    (collection.want_to_play?.length || 0) + 
    (collection.playing?.length || 0) + 
    (collection.played?.length || 0)
  ) : 0;

  // Extract all unique genres, themes, platforms, game modes, and player perspectives from games
  const extractFilterOptions = () => {
    if (!collection) return { allGenres: [], allThemes: [], allPlatforms: [], allGameModes: [], allPlayerPerspectives: [] };
    
    const allGames = [
      ...(collection.want_to_play || []),
      ...(collection.playing || []),
      ...(collection.played || [])
    ];
    
    const allGenres = [...new Set(allGames
      .filter(game => game.genres)
      .flatMap(game => {
        let genres = typeof game.genres === 'string' 
          ? game.genres.split(',').map(g => g.trim())
          : game.genres;
        return genres;
      })
    )].sort();
    
    const allThemes = [...new Set(allGames
      .filter(game => game.themes)
      .flatMap(game => typeof game.themes === 'string' 
        ? game.themes.split(',').map(t => t.trim())
        : game.themes)
    )].sort();

    const allPlatforms = [...new Set(allGames
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

    const allGameModes = [...new Set(allGames
      .filter(game => game.gameModes || game.game_modes)
      .flatMap(game => {
        const modes = game.gameModes || game.game_modes;
        return typeof modes === 'string' 
          ? modes.split(',').map(m => m.trim())
          : modes;
      })
    )].sort();

    const allPlayerPerspectives = [...new Set(allGames
      .filter(game => game.playerPerspectives || game.player_perspectives)
      .flatMap(game => {
        const perspectives = game.playerPerspectives || game.player_perspectives;
        return typeof perspectives === 'string' 
          ? perspectives.split(',').map(p => p.trim())
          : perspectives;
      })
    )].sort();

    return { allGenres, allThemes, allPlatforms, allGameModes, allPlayerPerspectives };
  };

  const { allGenres, allThemes, allPlatforms, allGameModes, allPlayerPerspectives } = extractFilterOptions();

  // Filter handlers
  const handleFilterChange = (filters) => {
    setGenreFilters(filters.genres || []);
    setThemeFilters(filters.themes || []);
    setPlatformFilters(filters.platforms || []);
    setGameModeFilters(filters.gameModes || []);
    setPerspectiveFilters(filters.playerPerspectives || []);
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
  };

  // Auth redirect
  if (!loading && !user) {
    return <Navigate to="/login" />;
  }

  // Loading state
  if (loading || isLoading) {
    return <LoadingState />;
  }

  const getActiveGamesCount = () => {
    let baseGames = [];
    switch (activeTab) {
      case "all":
        baseGames = [
          ...(collection.want_to_play || []),
          ...(collection.playing || []),
          ...(collection.played || [])
        ];
        break;
      case "want_to_play":
        baseGames = collection.want_to_play || [];
        break;
      case "playing":
        baseGames = collection.playing || [];
        break;
      case "played":
        baseGames = collection.played || [];
        break;
      case "my_lists":
        if (selectedList) {
          const list = myLists.find(list => list.id === selectedList);
          baseGames = list ? list.games || [] : [];
        }
        break;
      default:
        baseGames = [
          ...(collection.want_to_play || []),
          ...(collection.playing || []),
          ...(collection.played || [])
        ];
    }

    // Apply search filter
    if (searchQuery) {
      baseGames = baseGames.filter(game => 
        game.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply other filters
    if (genreFilters.length > 0 || themeFilters.length > 0 || 
        platformFilters.length > 0 || gameModeFilters.length > 0 || 
        perspectiveFilters.length > 0 || minRatingFilter > 0) {
      
      baseGames = baseGames.filter(game => 
        gamePassesAllFilters(game, {
          genres: genreFilters,
          themes: themeFilters,
          platforms: platformFilters,
          gameModes: gameModeFilters,
          playerPerspectives: perspectiveFilters,
          minRating: minRatingFilter
        })
      );
    }

    return baseGames.length;
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <LibraryHeader />

      {/* Tabs Navigation */}
      <div className="sticky top-12 z-30 bg-dark/95 backdrop-blur-sm border-b border-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-2">
          <LibraryTabs 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collection={collection}
            totalGames={totalGames}
            myLists={myLists}
            setSelectedList={setSelectedList}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gradient-to-b from-dark/95 to-dark pb-12">
        <div className="container mx-auto px-4 py-6">
          {totalGames === 0 ? (
            <EmptyLibrary />
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column - Games */}
              <div className="flex-1">
                {/* Card Container */}
                <div className="bg-surface-dark/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-800/30 overflow-hidden">
                  <div className="p-4 border-b border-gray-800/30">
                    {/* Controls Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      {/* Games Count and Search Input */}
                      <div className="flex items-center gap-3 order-1 sm:order-none">
                        <div className="text-light/70 text-sm">
                          <span className="font-semibold text-light">{getActiveGamesCount()}</span> Games
                        </div>
                        
                        {/* Search Input */}
                        <SearchInput 
                          value={searchQuery}
                          onChange={setSearchQuery}
                        />
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
                            activeGenres={genreFilters}
                            activeThemes={themeFilters}
                            activePlatforms={platformFilters}
                            activeGameModes={gameModeFilters}
                            activePlayerPerspectives={perspectiveFilters}
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
                      minRating={minRatingFilter}
                      onRemoveGenre={handleRemoveGenre}
                      onRemoveTheme={handleRemoveTheme}
                      onRemovePlatform={handleRemovePlatform}
                      onRemoveGameMode={handleRemoveGameMode}
                      onRemovePerspective={handleRemovePerspective}
                      onRemoveRating={handleRemoveRating}
                      onClearAll={handleClearAllFilters}
                    />
                  </div>
                  
                  {/* Games Display */}
                  <div className="p-5">
                    <GameLibraryGrid 
                      collection={collection}
                      activeTab={activeTab}
                      selectedList={selectedList}
                      myLists={myLists}
                      searchQuery={searchQuery}
                      viewMode={viewMode}
                      sortOption={sortOption}
                      activeFilters={{
                        genres: genreFilters,
                        themes: themeFilters,
                        platforms: platformFilters,
                        gameModes: gameModeFilters,
                        playerPerspectives: perspectiveFilters,
                        minRating: minRatingFilter
                      }}
                    />
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
                  activeGenres={genreFilters}
                  activeThemes={themeFilters}
                  activePlatforms={platformFilters}
                  activeGameModes={gameModeFilters}
                  activePlayerPerspectives={perspectiveFilters}
                  minRating={minRatingFilter}
                  onFilterChange={handleFilterChange}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default MyLibraryPage; 