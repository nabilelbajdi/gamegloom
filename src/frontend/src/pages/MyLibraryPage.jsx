import React, { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useUserGameStore from "../store/useUserGameStore";
import useUserListStore from "../store/useUserListStore";
import LibraryHeader from "../components/library/LibraryHeader";
import LibraryTabs from "../components/library/LibraryTabs";
import GameLibraryGrid from "../components/library/GameLibraryGrid";
import LoadingState from "../components/library/LoadingState";
import { EmptyLibrary, EmptyListGames } from "../components/library/EmptyState";
import UserLists from "../components/library/UserLists";
import ScrollToTop from "../components/common/ScrollToTop";
import SortDropdown from "../components/common/SortDropdown";
import FilterDropdown from "../components/common/FilterDropdown";
import FilterPanel from "../components/common/FilterPanel";
import ViewToggle from "../components/common/ViewToggle";
import ActiveFilters from "../components/common/ActiveFilters";
import { gamePassesAllFilters } from "../utils/filterUtils";
import { createSlug } from "../utils/stringUtils";

const MyLibraryPage = () => {
  const { user, loading } = useAuth();
  const { collection, fetchCollection, isLoading } = useUserGameStore();
  const { lists, fetchLists, listsLoading } = useUserListStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Component state
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState(() => localStorage.getItem("librarySortOption") || "last_played");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("libraryViewMode") || "grid");
  const [selectedList, setSelectedList] = useState(null);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem("librarySortOption", sortOption);
  }, [sortOption]);

  useEffect(() => {
    localStorage.setItem("libraryViewMode", viewMode);
  }, [viewMode]);

  // Filter states
  const [genreFilters, setGenreFilters] = useState([]);
  const [themeFilters, setThemeFilters] = useState([]);
  const [platformFilters, setPlatformFilters] = useState([]);
  const [gameModeFilters, setGameModeFilters] = useState([]);
  const [perspectiveFilters, setPerspectiveFilters] = useState([]);
  const [minRatingFilter, setMinRatingFilter] = useState(0);
  const [contentTypeFilters, setContentTypeFilters] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');

    // Handle tab selection
    if (tabParam && ['all', 'want_to_play', 'playing', 'played', 'my_lists'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      // Default to 'all' if no tab param or invalid
      setActiveTab('all');
    }

    // Handle list selection from URL parameter using slug
    const listSlugParam = params.get('list');
    if (listSlugParam && tabParam === 'my_lists' && lists.length > 0) {
      // Find the list by comparing slugs
      const foundList = lists.find(list => createSlug(list.name) === listSlugParam);
      if (foundList) {
        setSelectedList(foundList.id);
      } else {
        setSelectedList(null);
      }
    } else {
      // Clear selected list if not in url
      setSelectedList(null);
    }
  }, [location.search, lists]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);

    if (tabId === 'all') {
      navigate('/library', { replace: true });
    } else {
      navigate(`/library?tab=${tabId}`, { replace: true });
    }
  };

  // Function to handle list selection with URL update
  const handleListSelect = (listId) => {
    setSelectedList(listId);

    // Find the list name and create a slug
    const selectedList = lists.find(list => list.id === listId);
    if (selectedList) {
      const listSlug = createSlug(selectedList.name);
      navigate(`/library?tab=my_lists&list=${listSlug}`, { replace: true });
    }
  };

  // Fetch user collection and lists on mount
  useEffect(() => {
    if (user) {
      fetchCollection();
      fetchLists();
    }
  }, [user, fetchCollection, fetchLists]);

  // Calculate total games count
  const totalGames = collection ? (
    (collection.want_to_play?.length || 0) +
    (collection.playing?.length || 0) +
    (collection.played?.length || 0)
  ) : 0;

  // Extract all unique genres, themes, platforms, game modes, and player perspectives from games
  const extractFilterOptions = () => {
    if (!collection) return { allGenres: [], allThemes: [], allPlatforms: [], allGameModes: [], allPlayerPerspectives: [], allContentTypes: [] };

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

    const allContentTypes = [...new Set(allGames
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

  // Auth redirect
  if (!loading && !user) {
    return <Navigate to="/login" />;
  }

  // Loading state
  if (loading || isLoading || listsLoading) {
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
          const list = lists.find(list => list.id === selectedList);
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

    // Apply content type filter
    if (contentTypeFilters.length > 0) {
      baseGames = baseGames.filter(game =>
        game.game_type_name && (
          contentTypeFilters.includes(game.game_type_name) ||
          (game.game_type_name === "Main Game" && contentTypeFilters.includes("Base Game"))
        )
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

  // Get the current list name if a list is selected
  const getSelectedListName = () => {
    if (selectedList) {
      const list = lists.find(list => list.id === selectedList);
      return list ? list.name : "";
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <LibraryHeader />

      {/* Tabs Navigation */}
      <div className="sticky top-12 z-30 bg-[rgba(9,9,11,0.95)] backdrop-blur-sm border-b border-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-2">
          <LibraryTabs
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            collection={collection}
            totalGames={totalGames}
            myLists={lists}
            setSelectedList={handleListSelect}
            selectedList={selectedList}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[var(--bg-base)] pb-12">
        <div className="container mx-auto px-4 py-6">
          {totalGames === 0 && activeTab !== "my_lists" ? (
            <EmptyLibrary />
          ) : (
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

              {/* Right Column - Games */}
              <div className="flex-1">
                {/* Card Container */}
                <div className="bg-surface-dark/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-800/30 overflow-hidden">
                  {activeTab === "my_lists" && !selectedList ? (
                    <div className="p-5">
                      <UserLists onSelectList={handleListSelect} />
                    </div>
                  ) : activeTab === "my_lists" && selectedList && lists.find(list => list.id === selectedList)?.games?.length === 0 ? (
                    <EmptyListGames listName={getSelectedListName()} />
                  ) : (
                    <div>
                      {/* Tabs & Filter Controls Row */}
                      <div className="border-b border-gray-800/30">
                        {/* Controls Section */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4">
                          {/* Games Count */}
                          <div className="flex items-center gap-3 order-1 sm:order-none">
                            <div className="text-light/70 text-sm">
                              <span className="font-semibold text-light">{getActiveGamesCount()}</span> Games
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

                      {/* Game Grid Display */}
                      <div className="p-5">
                        <GameLibraryGrid
                          collection={collection}
                          activeTab={activeTab}
                          selectedList={selectedList}
                          myLists={lists}
                          searchQuery={searchQuery}
                          viewMode={viewMode}
                          sortOption={sortOption}
                          activeFilters={{
                            genres: genreFilters,
                            themes: themeFilters,
                            platforms: platformFilters,
                            gameModes: gameModeFilters,
                            playerPerspectives: perspectiveFilters,
                            contentTypes: contentTypeFilters,
                            minRating: minRatingFilter
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
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