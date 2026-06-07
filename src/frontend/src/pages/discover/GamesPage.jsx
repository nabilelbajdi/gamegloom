import React, { useState, useEffect, useMemo } from "react";
import { fetchAllGames, fetchAllGamesCount } from "../../api";
import PageMeta from "../../components/common/PageMeta";
import CategoryHeader from "../../components/discover/CategoryHeader";
import GamesGrid from "../../components/discover/GamesGrid";
import GamesList from "../../components/common/GamesList";
import FilterDropdown from "../../components/common/FilterDropdown";
import FilterPanel from "../../components/common/FilterPanel";
import SortDropdown from "../../components/common/SortDropdown";
import ViewToggle from "../../components/common/ViewToggle";
import ActiveFilters from "../../components/common/ActiveFilters";
import ScrollToTop from "../../components/common/ScrollToTop";
import ErrorState from "../../components/common/ErrorState";
import { gamePassesAllFilters } from "../../utils/filterUtils";
import { readFunctional, writeFunctional } from "../../utils/consent";
import useFilterParams from "../../hooks/useFilterParams";

// Filter and sort keys persisted in the URL for this page
const DISCOVER_FILTER_SCHEMA = {
    filters: ["genres", "themes", "platforms", "gameModes", "playerPerspectives", "contentTypes", "minRating"],
    sort: { values: ["rating_high", "release_new", "name_asc"], default: "rating_high" },
};

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
    const [pageStatus, setPageStatus] = useState("loading");
    const [retryCount, setRetryCount] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Preferences - persisted
    const [viewMode, setViewMode] = useState(() => readFunctional("allGamesViewMode") || "grid");
    const { filters, sortOption, applyFilters, setSort, clearAll } = useFilterParams(DISCOVER_FILTER_SCHEMA);

    // Ephemeral title filter
    const [searchQuery, setSearchQuery] = useState("");

    // Persist preferences (no-op if user hasn't accepted cookie consent)
    useEffect(() => {
        writeFunctional("allGamesViewMode", viewMode);
    }, [viewMode]);

    // Fetch games on mount, when sort changes, or when retried
    useEffect(() => {
        const loadGames = async () => {
            setLoading(true);
            setPageStatus("loading");
            setHasMore(true);

            try {
                const [gamesData, count] = await Promise.all([
                    fetchAllGames(50, 0, SORT_MAP[sortOption]),
                    fetchAllGamesCount()
                ]);

                setGames(gamesData || []);
                setTotalCount(count);
                setHasMore(gamesData?.length >= 50 && gamesData?.length < count);
                setPageStatus("success");
            } catch {
                setGames([]);
                setPageStatus("error");
            } finally {
                setLoading(false);
            }
        };

        loadGames();
    }, [sortOption, retryCount]);

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
    }, [games, searchQuery, filters]);

    return (
        <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
            <PageMeta title="All Games" description="Browse the full GameGloom catalogue — filter by genre, platform, rating, and more." />
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
                                    {pageStatus === "error" ? (
                                        <ErrorState
                                            message="Couldn't load games."
                                            onRetry={() => setRetryCount(c => c + 1)}
                                        />
                                    ) : viewMode === "grid" ? (
                                        <GamesGrid
                                            games={filteredGames}
                                            loading={loading}
                                        />
                                    ) : (
                                        <GamesList
                                            games={filteredGames}
                                            loading={loading}
                                            status={pageStatus}
                                            onRetry={() => setRetryCount(c => c + 1)}
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
