// hooks/useSyncReview.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getPSNLibrary, syncPSNLibrary, importPSNGames, skipPSNGame, fixPSNMatch, restorePSNGame } from '../api';
import useUserGameStore from '../store/useUserGameStore';
import useToastStore from '../store/useToastStore';

/**
 * Custom hook for PSN/Steam sync review.
 * Uses database-cached library data for fast loads.
 */
export const useSyncReview = (platform) => {
    const { fetchCollection } = useUserGameStore();
    const toast = useToastStore();

    // Core state
    const [games, setGames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 });
    const [error, setError] = useState(null);
    const [needsSync, setNeedsSync] = useState(false);  // True if DB cache is empty

    // UI state
    const [activeTab, setActiveTab] = useState('ready');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('last_played');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [fadingIds, setFadingIds] = useState(new Set());
    const [fixingGame, setFixingGame] = useState(null);
    const [importedIds, setImportedIds] = useState(new Set());
    const [skippedIds, setSkippedIds] = useState(new Set());

    const platformName = platform === 'psn' ? 'PlayStation' : 'Steam';

    // ─────────────────────────────────────────────────────────────
    // Data Loading (from database cache - fast ~50ms)
    // ─────────────────────────────────────────────────────────────

    const loadGames = useCallback(async () => {
        if (platform !== 'psn') {
            setError('Only PSN is supported for now');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Fetch from database cache (includes hidden)
            const data = await getPSNLibrary(true);

            if (data.length === 0) {
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
            setError(err.message);
            toast.error('Failed to load: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    }, [platform, toast]);

    // Load on mount
    useEffect(() => {
        loadGames();
    }, [platform]); // eslint-disable-line react-hooks/exhaustive-deps

    // Clear selection when switching tabs
    useEffect(() => {
        setSelectedIds(new Set());
    }, [activeTab]);

    // ─────────────────────────────────────────────────────────────
    // Sync = Fetch from PSN API and update database cache
    // ─────────────────────────────────────────────────────────────

    const handleSync = useCallback(async () => {
        setIsSyncing(true);
        setError(null);

        try {
            const result = await syncPSNLibrary();

            if (result.new_count > 0) {
                toast.success(`Found ${result.new_count} new games!`);
            } else {
                toast.success('Sync complete. Library is up to date.');
            }

            await loadGames();

        } catch (err) {
            setError(err.message);
            toast.error('Failed to sync: ' + err.message);
        } finally {
            setIsSyncing(false);
        }
    }, [loadGames, platformName, toast]);


    // ─────────────────────────────────────────────────────────────
    // Import Actions
    // ─────────────────────────────────────────────────────────────

    const handleConfirm = useCallback(async (gameId) => {
        const game = games.find(g => g.id === gameId);
        if (!game || !game.igdb_id) return;

        try {
            setFadingIds(prev => new Set([...prev, gameId]));

            await importPSNGames([{ igdb_id: game.igdb_id, list_type: 'played' }]);


            setTimeout(() => {
                setImportedIds(prev => new Set([...prev, gameId]));
                setFadingIds(prev => {
                    const next = new Set(prev);
                    next.delete(gameId);
                    return next;
                });
                fetchCollection();
                toast.success(`Imported: ${game.igdb_name || game.platform_name}`);
            }, 300);
        } catch (err) {
            setError(err.message);
            setFadingIds(prev => {
                const next = new Set(prev);
                next.delete(gameId);
                return next;
            });
            toast.error('Import failed: ' + err.message);
        }
    }, [games, fetchCollection, toast]);

    const handleSkip = useCallback(async (gameId) => {
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        setFadingIds(prev => new Set([...prev, gameId]));

        try {
            await skipPSNGame(game.platform_id);



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
            toast.error('Failed to skip: ' + err.message);
        }
    }, [games, toast]);

    const handleUnskip = useCallback(async (gameId) => {
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        try {
            await restorePSNGame(game.platform_id);

            setGames(prev => prev.map(g =>
                g.id === gameId ? { ...g, status: 'pending', match_method: null } : g
            ));



            toast.success('Game restored');
        } catch (err) {
            toast.error('Failed to restore: ' + err.message);
        }
    }, [games, toast]);

    const handleDelete = useCallback(async (gameId) => {
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        setFadingIds(prev => new Set([...prev, gameId]));

        try {
            await skipPSNGame(game.platform_id);

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
            toast.error('Failed to hide: ' + err.message);
        }
    }, [games, toast]);

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
                igdb_id: g.igdb_id,
                list_type: 'played'
            }));

            await importPSNGames(gamesToImport);

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
                toast.success(`Imported ${selectedGames.length} games`);
            }, 300);
        } catch (err) {
            setError(err.message);
            setIsProcessing(false);
            setFadingIds(new Set());
            toast.error('Import failed: ' + err.message);
        }
    }, [selectedIds, games, importedIds, fetchCollection, toast]);

    const handleBulkSkip = useCallback(() => {
        if (selectedIds.size === 0) return;

        setFadingIds(new Set(selectedIds));

        setTimeout(() => {
            setSkippedIds(prev => {
                const next = new Set(prev);
                selectedIds.forEach(id => next.add(id));
                return next;
            });
            setSelectedIds(new Set());
            setFadingIds(new Set());
            toast.info(`Skipped ${selectedIds.size} games`);
        }, 300);
    }, [selectedIds, toast]);

    const handleImportAllReady = useCallback(async () => {
        const readyGames = games.filter(g =>
            g.igdb_id && !importedIds.has(g.id) && !skippedIds.has(g.id)
        );

        if (readyGames.length === 0) return;

        setIsProcessing(true);
        setProcessProgress({ current: 0, total: readyGames.length });
        setFadingIds(new Set(readyGames.map(g => g.id)));

        try {
            const gamesToImport = readyGames.map(g => ({
                igdb_id: g.igdb_id,
                list_type: 'played'
            }));

            await importPSNGames(gamesToImport);

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
                toast.success(`🎉 Imported ${readyGames.length} games!`);
            }, 500);
        } catch (err) {
            setError(err.message);
            setIsProcessing(false);
            setFadingIds(new Set());
            toast.error('Import failed: ' + err.message);
        }
    }, [games, importedIds, skippedIds, fetchCollection, toast]);

    const handleSkipAllUnmatched = useCallback(() => {
        const unmatchedGames = games.filter(g =>
            !g.igdb_id && !importedIds.has(g.id) && !skippedIds.has(g.id)
        );

        if (unmatchedGames.length === 0) return;

        setFadingIds(new Set(unmatchedGames.map(g => g.id)));

        setTimeout(() => {
            setSkippedIds(prev => {
                const next = new Set(prev);
                unmatchedGames.forEach(g => next.add(g.id));
                return next;
            });
            setFadingIds(new Set());
            toast.info(`Skipped ${unmatchedGames.length} unmatched games`);
        }, 300);
    }, [games, importedIds, skippedIds, toast]);

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
            await fixPSNMatch(updatedGame.platform_id, updatedGame.igdb_id, updatedGame.igdb_name, updatedGame.igdb_cover_url);

            // Now import the game to library
            await importPSNGames([{ igdb_id: updatedGame.igdb_id, list_type: 'played' }]);

            // Update local state
            setGames(prev => prev.map(g =>
                g.id === updatedGame.id
                    ? { ...g, igdb_id: updatedGame.igdb_id, igdb_name: updatedGame.igdb_name, igdb_cover_url: updatedGame.igdb_cover_url }
                    : g
            ));
            setImportedIds(prev => new Set([...prev, updatedGame.id]));
            fetchCollection();
            toast.success(`Imported: ${updatedGame.igdb_name}`);
        } catch (err) {
            toast.error(`Failed to import: ${err.message}`);
        }
    }, [fetchCollection, toast]);

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
