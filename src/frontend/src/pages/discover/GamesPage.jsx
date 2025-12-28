import React, { useState, useEffect, useMemo } from "react";
import { fetchAllGames, fetchAllGamesCount } from "../../api";
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

// Sort options for all games
const SORT_OPTIONS = [
    { value: "rating_high", label: "Top Rated" },
    { value: "name_asc", label: "Name" },
    { value: "release_new", label: "Latest Release" },
    { value: "release_old", label: "Oldest Release" }
];

// Map frontend sort values to backend sort values
const SORT_MAP = {
    "rating_high": "rating",
    "name_asc": "name",
    "release_new": "release_new",
    "release_old": "release_old"
};

const GamesPage = () => {
    const [games, setGames] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Preferences - persisted
    const [viewMode, setViewMode] = useState(() => localStorage.getItem("allGamesViewMode") || "grid");
    const [sortOption, setSortOption] = useState(() => localStorage.getItem("allGamesSortOption") || "rating_high");

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [genreFilters, setGenreFilters] = useState([]);
    const [themeFilters, setThemeFilters] = useState([]);
    const [platformFilters, setPlatformFilters] = useState([]);
    const [gameModeFilters, setGameModeFilters] = useState([]);
    const [perspectiveFilters, setPerspectiveFilters] = useState([]);
    const [minRatingFilter, setMinRatingFilter] = useState(0);
    const [contentTypeFilters, setContentTypeFilters] = useState([]);

    // Persist preferences
    useEffect(() => {
        localStorage.setItem("allGamesViewMode", viewMode);
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem("allGamesSortOption", sortOption);
    }, [sortOption]);

    // Fetch games on mount and when sort changes
    useEffect(() => {
        const loadGames = async () => {
            setLoading(true);
            setHasMore(true);

            const [gamesData, count] = await Promise.all([
                fetchAllGames(50, 0, SORT_MAP[sortOption]),
                fetchAllGamesCount()
            ]);

            setGames(gamesData || []);
            setTotalCount(count);
            setHasMore(gamesData?.length >= 50 && gamesData?.length < count);
            setLoading(false);
        };

        loadGames();
    }, [sortOption]);

    // Load more games
    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        const moreGames = await fetchAllGames(50, games.length, SORT_MAP[sortOption]);

        if (moreGames && moreGames.length > 0) {
            setGames(prev => [...prev, ...moreGames]);
            setHasMore(moreGames.length >= 50 && games.length + moreGames.length < totalCount);
        } else {
            setHasMore(false);
        }
        setLoadingMore(false);
    };

    // Extract filter options from loaded games
    const extractFilterOptions = () => {
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

        const allPlatforms = [...new Set(games
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

        const allGameModes = [...new Set(games
            .filter(game => game.gameModes || game.game_modes)
            .flatMap(game => {
                const modes = game.gameModes || game.game_modes;
                return typeof modes === 'string'
                    ? modes.split(',').map(m => m.trim())
                    : modes;
            })
        )].sort();

        const allPlayerPerspectives = [...new Set(games
            .filter(game => game.playerPerspectives || game.player_perspectives)
            .flatMap(game => {
                const perspectives = game.playerPerspectives || game.player_perspectives;
                return typeof perspectives === 'string'
                    ? perspectives.split(',').map(p => p.trim())
                    : perspectives;
            })
        )].sort();

        const allContentTypes = [...new Set(games
            .filter(game => game.game_type_name)
            .map(game => game.game_type_name === "Main Game" ? "Base Game" : game.game_type_name)
        )].sort();

        return { allGenres, allThemes, allPlatforms, allGameModes, allPlayerPerspectives, allContentTypes };
    };

    const { allGenres, allThemes, allPlatforms, allGameModes, allPlayerPerspectives, allContentTypes } = extractFilterOptions();

    // Filter games
    const filteredGames = useMemo(() => {
        return games.filter(game => {
            // Search filter
            const matchesSearch = !searchQuery ||
                game.name.toLowerCase().includes(searchQuery.toLowerCase());

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
    }, [games, searchQuery, contentTypeFilters, genreFilters, themeFilters, platformFilters, gameModeFilters, perspectiveFilters, minRatingFilter]);

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

    const handleRemoveGenre = (genre) => setGenreFilters(prev => prev.filter(g => g !== genre));
    const handleRemoveTheme = (theme) => setThemeFilters(prev => prev.filter(t => t !== theme));
    const handleRemovePlatform = (platform) => setPlatformFilters(prev => prev.filter(p => p !== platform));
    const handleRemoveGameMode = (mode) => setGameModeFilters(prev => prev.filter(m => m !== mode));
    const handleRemovePerspective = (perspective) => setPerspectiveFilters(prev => prev.filter(p => p !== perspective));
    const handleRemoveContentType = (contentType) => setContentTypeFilters(prev => prev.filter(ct => ct !== contentType));
    const handleRemoveRating = () => setMinRatingFilter(0);

    const handleClearAllFilters = () => {
        setSearchQuery("");
        setGenreFilters([]);
        setThemeFilters([]);
        setPlatformFilters([]);
        setGameModeFilters([]);
        setPerspectiveFilters([]);
        setMinRatingFilter(0);
        setContentTypeFilters([]);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
            {/* Header Section - Using CategoryHeader for consistency */}
            <CategoryHeader
                title="All Games"
                description={`Browse all ${totalCount.toLocaleString()} games in the database`}
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
                            <div className="bg-surface-dark/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-800/30 overflow-hidden">
                                <div className="p-4 border-b border-gray-800/30">
                                    {/* Controls Section */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        {/* Games Count */}
                                        <div className="flex items-center gap-3 order-1 sm:order-none">
                                            <div className="text-light/70 text-sm">
                                                <span className="font-semibold text-light">{filteredGames.length}</span> of {totalCount.toLocaleString()} games
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
                                            games={filteredGames}
                                            loading={loading}
                                        />
                                    ) : (
                                        <GamesList
                                            games={filteredGames}
                                            loading={loading}
                                        />
                                    )}

                                    {/* Load More */}
                                    {hasMore && !loading && filteredGames.length > 0 && (
                                        <div className="text-center mt-6">
                                            <button
                                                onClick={handleLoadMore}
                                                disabled={loadingMore}
                                                className="text-primary/70 hover:text-primary text-sm transition-colors hover:underline disabled:opacity-50 cursor-pointer"
                                            >
                                                {loadingMore ? "Loading..." : "Load more games"}
                                            </button>
                                        </div>
                                    )}

                                    {/* All loaded message */}
                                    {!hasMore && filteredGames.length > 0 && (
                                        <div className="text-center text-light/40 mt-6 text-xs">
                                            Showing all {games.length} games loaded
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

export default GamesPage;
