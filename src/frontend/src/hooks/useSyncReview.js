// hooks/useSyncReview.js
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    getPSNLibrary, syncPSNLibrary, importPSNGames, skipPSNGame, fixPSNMatch, restorePSNGame,
    getSteamLibrary, syncSteamLibrary, importSteamGames, skipSteamGame, fixSteamMatch, restoreSteamGame
} from '../api';
import useUserGameStore from '../store/useUserGameStore';
import useToastStore from '../store/useToastStore';

/**
 * Custom hook for PSN/Steam sync review.
 * Uses database-cached library data for fast loads.
 */
export const useSyncReview = (platform) => {
    const fetchCollection = useUserGameStore(state => state.fetchCollection);
    const toastSuccess = useToastStore(state => state.success);
    const toastError = useToastStore(state => state.error);
    const toastInfo = useToastStore(state => state.info);


    // Core state
    const [games, setGames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 });
    const [error, setError] = useState(null);
    const [needsSync, setNeedsSync] = useState(false);  // True if DB cache is empty
    const [syncProgress, setSyncProgress] = useState(0);

    // UI state
    const [activeTab, setActiveTab] = useState('ready');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('last_played');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [fadingIds, setFadingIds] = useState(new Set());
    const [fixingGame, setFixingGame] = useState(null);
    const [importedIds, setImportedIds] = useState(new Set());
    const [skippedIds, setSkippedIds] = useState(new Set());

    // For stable loadGames check without depending on games count
    const gamesRef = useRef(games);
    useEffect(() => { gamesRef.current = games; }, [games]);

    const platformName = platform === 'psn' ? 'PlayStation' : 'Steam';


    // ─────────────────────────────────────────────────────────────
    // Platform API Helper
    // ─────────────────────────────────────────────────────────────

    const api = useMemo(() => {
        if (platform === 'psn') {
            return {
                getLibrary: getPSNLibrary,
                syncLibrary: syncPSNLibrary,
                importGames: importPSNGames,
                skipGame: skipPSNGame,
                fixMatch: fixPSNMatch,
                restoreGame: restorePSNGame
            };
        } else {
            return {
                getLibrary: getSteamLibrary,
                syncLibrary: syncSteamLibrary,
                importGames: importSteamGames,
                skipGame: skipSteamGame,
                fixMatch: fixSteamMatch,
                restoreGame: restoreSteamGame
            };
        }
    }, [platform]);

    // ─────────────────────────────────────────────────────────────
    // Data Loading (from database cache - fast ~50ms)
    // ─────────────────────────────────────────────────────────────

    const loadGames = useCallback(async (silent = false) => {
        try {
            // Only show skeletons if genuinely empty and not a silent refresh
            if (!silent && gamesRef.current.length === 0) {
                setIsLoading(true);
            }
            setError(null);

            // Fetch from database cache (includes hidden)
            const data = await api.getLibrary(true);


            if (!data || data.length === 0) {
                // No cached data - user needs to sync first
                setNeedsSync(true);
                setGames([]);
            } else {
                setNeedsSync(false);
                // Add unique IDs - use status from API directly
                const gamesWithIds = data.map((g) => ({
                    ...g,
                    id: g.platform_id
                    // status comes from API: 'pending' | 'imported' | 'hidden'
                }));
                setGames(gamesWithIds);
            }

            setSelectedIds(new Set());
            setFadingIds(new Set());
            setImportedIds(new Set());
            setSkippedIds(new Set());

        } catch (err) {
            // 404 = no account linked or empty cache - that's fine, just show "needs sync"
            // Error messages include: "No PSN account linked", "No Steam account linked", "Failed to fetch X library"
            const msg = err.message?.toLowerCase() || '';
            if (msg.includes('account linked') || msg.includes('not linked') || msg.includes('failed to fetch')) {
                setNeedsSync(true);
                setGames([]);
                // No error toast - this is expected for first-time visitors
            } else {
                // Actual error
                setError(err.message);
                toastError('Failed to load: ' + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    }, [api, toastError]);





    // Load on mount
    useEffect(() => {
        loadGames();
    }, [platform, loadGames]);

    // Clear selection when switching tabs
    useEffect(() => {
        setSelectedIds(new Set());
    }, [activeTab]);

    // ─────────────────────────────────────────────────────────────
    // Sync = Fetch from Platform API and update database cache
    // ─────────────────────────────────────────────────────────────

    const handleSync = useCallback(async () => {
        setIsSyncing(true);
        setSyncProgress(0);
        setError(null);

        // Simulated progress interval
        const interval = setInterval(() => {
            setSyncProgress(prev => {
                if (prev >= 92) return prev;
                // Slower increment as we approach the end
                const inc = prev < 30 ? 4 : prev < 60 ? 2 : prev < 85 ? 1 : 0.3;
                return Math.min(prev + inc, 92);
            });
        }, 300);

        try {
            const result = await api.syncLibrary();

            setSyncProgress(100);

            if (result.new_count > 0) {
                toastSuccess(`Found ${result.new_count} new games!`);
            } else {
                toastSuccess('Sync complete. Library is up to date.');
            }

            await loadGames(true); // Silent refresh

        } catch (err) {
            setError(err.message);
            toastError('Failed to sync: ' + err.message);
            setSyncProgress(0);
        } finally {
            clearInterval(interval);
            setIsSyncing(false);
            // Keep at 100 for a moment then reset
            setTimeout(() => setSyncProgress(0), 1500);
        }
    }, [api, loadGames, toastError, toastSuccess]);





    // ─────────────────────────────────────────────────────────────
    // Import Actions
    // ─────────────────────────────────────────────────────────────

    const handleConfirm = useCallback(async (gameId) => {
        const game = games.find(g => g.id === gameId);
        if (!game || !game.igdb_id) return;

        try {
            setFadingIds(prev => new Set([...prev, gameId]));

            await api.importGames([{
                platform_id: game.platform_id,
                igdb_id: game.igdb_id,
                list_type: 'played'
            }]);


            setTimeout(() => {
                setImportedIds(prev => new Set([...prev, gameId]));
                setFadingIds(prev => {
                    const next = new Set(prev);
                    next.delete(gameId);
                    return next;
                });
                fetchCollection();
                toastSuccess(`Imported: ${game.igdb_name || game.platform_name}`);
            }, 300);
        } catch (err) {
            setError(err.message);
            setFadingIds(prev => {
                const next = new Set(prev);
                next.delete(gameId);
                return next;
            });
            toastError('Import failed: ' + err.message);
        }
    }, [games, api, fetchCollection, toastError, toastSuccess]);


    const handleSkip = useCallback(async (gameId) => {
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        setFadingIds(prev => new Set([...prev, gameId]));

        try {
            await api.skipGame(game.platform_id);

            setTimeout(() => {
                setGames(prev => prev.map(g =>
                    g.id === gameId ? { ...g, status: 'hidden', match_method: 'skipped' } : g
                ));
                setFadingIds(prev => {
                    const next = new Set(prev);
                    next.delete(gameId);
                    return next;
                });
            }, 300);
        } catch (err) {
            setFadingIds(prev => {
                const next = new Set(prev);
                next.delete(gameId);
                return next;
            });
            toastError('Failed to skip: ' + err.message);
        }
    }, [games, api, toastError]);


    const handleUnskip = useCallback(async (gameId) => {
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        try {
            await api.restoreGame(game.platform_id);

            setGames(prev => prev.map(g =>
                g.id === gameId ? { ...g, status: 'pending', match_method: null } : g
            ));

            toastSuccess('Game restored');
        } catch (err) {
            toastError('Failed to restore: ' + err.message);
        }
    }, [games, api, toastError, toastSuccess]);


    const handleDelete = useCallback(async (gameId) => {
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        setFadingIds(prev => new Set([...prev, gameId]));

        try {
            await api.skipGame(game.platform_id);

            setTimeout(() => {
                setGames(prev => prev.filter(g => g.id !== gameId));
                setFadingIds(prev => {
                    const next = new Set(prev);
                    next.delete(gameId);
                    return next;
                });
            }, 300);
        } catch (err) {
            setFadingIds(prev => {
                const next = new Set(prev);
                next.delete(gameId);
                return next;
            });
            toastError('Failed to hide: ' + err.message);
        }
    }, [games, api, toastError]);


    // ─────────────────────────────────────────────────────────────
    // Bulk Actions
    // ─────────────────────────────────────────────────────────────

    const handleImport = useCallback(async () => {
        if (selectedIds.size === 0) return;

        const selectedGames = games.filter(g =>
            selectedIds.has(g.id) && g.igdb_id && !importedIds.has(g.id)
        );

        if (selectedGames.length === 0) return;

        setIsProcessing(true);
        setProcessProgress({ current: 0, total: selectedGames.length });
        setFadingIds(new Set(selectedGames.map(g => g.id)));

        try {
            const gamesToImport = selectedGames.map(g => ({
                platform_id: g.platform_id,
                igdb_id: g.igdb_id,
                list_type: 'played'
            }));

            await api.importGames(gamesToImport);

            setTimeout(() => {
                setImportedIds(prev => {
                    const next = new Set(prev);
                    selectedGames.forEach(g => next.add(g.id));
                    return next;
                });
                setSelectedIds(new Set());
                setFadingIds(new Set());
                setIsProcessing(false);
                setProcessProgress({ current: 0, total: 0 });
                fetchCollection();
                toastSuccess(`Imported ${selectedGames.length} games`);
            }, 300);
        } catch (err) {
            setError(err.message);
            setIsProcessing(false);
            setFadingIds(new Set());
            toastError('Import failed: ' + err.message);
        }
    }, [selectedIds, games, importedIds, api, fetchCollection, toastError, toastSuccess]);


    const handleBulkSkip = useCallback(async () => {
        if (selectedIds.size === 0) return;

        setFadingIds(new Set(selectedIds));

        try {
            // Sequential skips for reliability
            for (const id of selectedIds) {
                const game = games.find(g => g.id === id);
                if (game) await api.skipGame(game.platform_id);
            }

            setTimeout(() => {
                setSkippedIds(prev => {
                    const next = new Set(prev);
                    selectedIds.forEach(id => next.add(id));
                    return next;
                });
                setSelectedIds(new Set());
                setFadingIds(new Set());
                toastInfo(`Skipped ${selectedIds.size} games`);
            }, 300);
        } catch (err) {
            toastError("Failed to skip some games");
            setFadingIds(new Set());
        }
    }, [selectedIds, games, api, toastError, toastInfo]);


    const handleImportAllReady = useCallback(async () => {
        const readyGames = games.filter(g =>
            g.igdb_id && !importedIds.has(g.id) && !skippedIds.has(g.id) && g.status === 'pending'
        );

        if (readyGames.length === 0) return;

        setIsProcessing(true);
        setProcessProgress({ current: 0, total: readyGames.length });
        setFadingIds(new Set(readyGames.map(g => g.id)));

        try {
            const gamesToImport = readyGames.map(g => ({
                platform_id: g.platform_id,
                igdb_id: g.igdb_id,
                list_type: 'played'
            }));

            await api.importGames(gamesToImport);

            setTimeout(() => {
                setImportedIds(prev => {
                    const next = new Set(prev);
                    readyGames.forEach(g => next.add(g.id));
                    return next;
                });
                setFadingIds(new Set());
                setIsProcessing(false);
                setProcessProgress({ current: 0, total: 0 });
                setSelectedIds(new Set());
                fetchCollection();
                toastSuccess(`🎉 Imported ${readyGames.length} games!`);
            }, 500);
        } catch (err) {
            setError(err.message);
            setIsProcessing(false);
            setFadingIds(new Set());
            toastError('Import failed: ' + err.message);
        }
    }, [games, importedIds, skippedIds, api, fetchCollection, toastError, toastSuccess]);


    const handleSkipAllUnmatched = useCallback(async () => {
        const unmatchedGames = games.filter(g =>
            !g.igdb_id && !importedIds.has(g.id) && !skippedIds.has(g.id) && g.status === 'pending'
        );

        if (unmatchedGames.length === 0) return;

        setFadingIds(new Set(unmatchedGames.map(g => g.id)));

        try {
            for (const game of unmatchedGames) {
                await api.skipGame(game.platform_id);
            }

            setTimeout(() => {
                setSkippedIds(prev => {
                    const next = new Set(prev);
                    unmatchedGames.forEach(g => next.add(g.id));
                    return next;
                });
                setFadingIds(new Set());
                toastInfo(`Skipped ${unmatchedGames.length} unmatched games`);
            }, 300);

        } catch (err) {
            toastError("Failed to skip some games");
            setFadingIds(new Set());
        }
    }, [games, importedIds, skippedIds, api, toastError, toastInfo]);


    // ─────────────────────────────────────────────────────────────
    // Computed: apply imported/skipped status locally
    // ─────────────────────────────────────────────────────────────

    const gamesWithStatus = useMemo(() => {
        // Apply locally tracked imported/skipped status
        // Note: 'hidden' status comes from API (match_method === 'skipped')
        return games.map(g => ({
            ...g,
            status: importedIds.has(g.id)
                ? 'imported'
                : skippedIds.has(g.id)
                    ? 'skipped'
                    : g.status // Keep 'hidden' or 'pending' from original
        }));
    }, [games, importedIds, skippedIds]);

    // ─────────────────────────────────────────────────────────────
    // Selection
    // ─────────────────────────────────────────────────────────────

    const toggleSelect = useCallback((id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const selectAllVisible = useCallback(() => {
        // Filter games inline to avoid circular deps with filteredGames
        let visible = gamesWithStatus;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            visible = visible.filter(g =>
                g.platform_name?.toLowerCase().includes(query) ||
                g.igdb_name?.toLowerCase().includes(query)
            );
        }

        const selectableIds = visible
            .filter(g => {
                if (activeTab === 'ready') return g.igdb_id && g.status === 'pending';
                if (activeTab === 'unmatched') return !g.igdb_id && g.status === 'pending';
                return false;
            })
            .map(g => g.id);
        setSelectedIds(new Set(selectableIds));
    }, [gamesWithStatus, searchQuery, activeTab]);

    // ─────────────────────────────────────────────────────────────
    // Fix Match Modal
    // ─────────────────────────────────────────────────────────────

    const handleFixGame = useCallback((game) => {
        setFixingGame(game);
    }, []);

    const handleGameFixed = useCallback(async (updatedGame) => {
        // Save the manual match AND import the game
        try {
            // Save the match preference (persists across re-syncs)
            await api.fixMatch(updatedGame.platform_id, updatedGame.igdb_id, updatedGame.igdb_name, updatedGame.igdb_cover_url);

            // Now import the game to library
            await api.importGames([{
                platform_id: updatedGame.platform_id,
                igdb_id: updatedGame.igdb_id,
                list_type: 'played'
            }]);

            // Update local state
            setGames(prev => prev.map(g =>
                g.id === updatedGame.id
                    ? { ...g, igdb_id: updatedGame.igdb_id, igdb_name: updatedGame.igdb_name, igdb_cover_url: updatedGame.igdb_cover_url }
                    : g
            ));
            setImportedIds(prev => new Set([...prev, updatedGame.id]));
            fetchCollection();
            toastSuccess(`Imported: ${updatedGame.igdb_name}`);
        } catch (err) {
            toastError(`Failed to import: ${err.message}`);
        }
    }, [api, fetchCollection, toastError, toastSuccess]);


    const closeFixModal = useCallback(() => {
        setFixingGame(null);
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Filtering
    // ─────────────────────────────────────────────────────────────

    const filterByTab = useCallback((gamesList, tab) => {
        switch (tab) {
            case 'ready':
                return gamesList.filter(g =>
                    g.igdb_id &&
                    g.status !== 'imported' &&
                    g.status !== 'skipped' &&
                    g.status !== 'hidden'
                );
            case 'unmatched':
                return gamesList.filter(g =>
                    !g.igdb_id &&
                    g.status !== 'imported' &&
                    g.status !== 'skipped' &&
                    g.status !== 'hidden'
                );
            case 'skipped':
                // Games that are skipped or hidden (both mean skipped)
                return gamesList.filter(g =>
                    g.status === 'skipped' || g.status === 'hidden'
                );
            default:
                return gamesList;
        }
    }, []);



    // Sort games by option
    const sortGamesByOption = useCallback((gamesList, option) => {
        switch (option) {
            case 'last_played':
                return [...gamesList].sort((a, b) => {
                    const aDate = a.last_played_at ? new Date(a.last_played_at) : null;
                    const bDate = b.last_played_at ? new Date(b.last_played_at) : null;
                    if (!aDate && !bDate) return 0;
                    if (!aDate) return 1;
                    if (!bDate) return -1;
                    return bDate - aDate;
                });
            case 'playtime_high':
                return [...gamesList].sort((a, b) => (b.playtime_minutes || 0) - (a.playtime_minutes || 0));
            case 'name_asc':
                return [...gamesList].sort((a, b) => {
                    const aName = a.igdb_name || a.platform_name || '';
                    const bName = b.igdb_name || b.platform_name || '';
                    return aName.localeCompare(bName);
                });
            default:
                return gamesList;
        }
    }, []);

    const filteredGames = useMemo(() => {
        let result = gamesWithStatus;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(g =>
                g.platform_name?.toLowerCase().includes(query) ||
                g.igdb_name?.toLowerCase().includes(query)
            );
        }

        const tabFiltered = filterByTab(result, activeTab);
        return sortGamesByOption(tabFiltered, sortOption);
    }, [gamesWithStatus, activeTab, searchQuery, filterByTab, sortOption, sortGamesByOption]);

    const counts = useMemo(() => ({
        ready: filterByTab(gamesWithStatus, 'ready').length,
        unmatched: filterByTab(gamesWithStatus, 'unmatched').length,
        skipped: filterByTab(gamesWithStatus, 'skipped').length,
    }), [gamesWithStatus, filterByTab]);



    const readyGames = useMemo(() => filterByTab(gamesWithStatus, 'ready'), [gamesWithStatus, filterByTab]);
    const unmatchedGames = useMemo(() => filterByTab(gamesWithStatus, 'unmatched'), [gamesWithStatus, filterByTab]);

    // ─────────────────────────────────────────────────────────────
    // Keyboard Shortcuts
    // ─────────────────────────────────────────────────────────────

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                selectAllVisible();
            }

            if (e.key === 'Escape') {
                clearSelection();
            }

            if (e.key === 'Enter' && selectedIds.size > 0) {
                e.preventDefault();
                if (activeTab === 'ready') {
                    handleImport();
                } else if (activeTab === 'unmatched') {
                    handleBulkSkip();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectAllVisible, clearSelection, selectedIds, activeTab, handleImport, handleBulkSkip]);

    // ─────────────────────────────────────────────────────────────
    // Return API
    // ─────────────────────────────────────────────────────────────

    return {
        // State
        games: filteredGames,
        allGames: gamesWithStatus,
        counts,
        readyCount: readyGames.length,
        unmatchedCount: unmatchedGames.length,
        isLoading,
        isSyncing,
        isProcessing,
        processProgress,
        syncProgress,
        error,
        needsSync,
        activeTab,
        searchQuery,
        sortOption,
        selectedIds,
        fadingIds,
        fixingGame,
        platformName,

        // Actions
        handleSync,
        handleSkip,
        handleUnskip,
        handleDelete,
        handleConfirm,
        handleImport,
        handleImportAllReady,
        handleSkipAllUnmatched,
        handleBulkSkip,
        toggleSelect,
        selectAllVisible,
        clearSelection,
        setActiveTab,
        setSearchQuery,
        setSortOption,
        handleFixGame,
        handleGameFixed,
        closeFixModal,
    };
};

export default useSyncReview;
