// hooks/useSyncReview.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getSyncedGames, syncPlatform, updateSyncedGame, importSyncedGames } from '../api';
import useUserGameStore from '../store/useUserGameStore';
import useToastStore from '../store/useToastStore';

/**
 * Custom hook encapsulating all sync review page state and logic.
 * Separates concerns from UI rendering.
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

    // UI state
    const [activeTab, setActiveTab] = useState('ready');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [fadingIds, setFadingIds] = useState(new Set());
    const [fixingGame, setFixingGame] = useState(null);

    const platformName = platform === 'psn' ? 'PlayStation' : 'Steam';
    const [hasInitialSynced, setHasInitialSynced] = useState(false);

    // ─────────────────────────────────────────────────────────────
    // Data Loading
    // ─────────────────────────────────────────────────────────────

    const loadGames = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getSyncedGames(platform);
            setGames(data);
            setSelectedIds(new Set());
            setFadingIds(new Set());
            return data.length;
        } catch (err) {
            setError(err.message);
            return 0;
        } finally {
            setIsLoading(false);
        }
    }, [platform]);

    // Initial load + auto-sync if empty (first-time users)
    useEffect(() => {
        const initLoad = async () => {
            const count = await loadGames();
            // Auto-sync on first visit if no games synced yet
            if (count === 0 && !hasInitialSynced) {
                setHasInitialSynced(true);
                handleInitialSync();
            }
        };
        initLoad();
    }, [platform]); // eslint-disable-line react-hooks/exhaustive-deps

    // Clear selection when switching tabs
    useEffect(() => {
        setSelectedIds(new Set());
    }, [activeTab]);

    // ─────────────────────────────────────────────────────────────
    // Sync Actions
    // ─────────────────────────────────────────────────────────────

    // Initial sync (no toast for "no games" since it's expected)
    const handleInitialSync = async () => {
        try {
            setIsSyncing(true);
            setError(null);

            await syncPlatform(platform);
            const newData = await getSyncedGames(platform);
            setGames(newData);

            if (newData.length > 0) {
                toast.success(`Found ${newData.length} games from ${platformName}`);
            }
            // Don't show "no games" toast on initial sync - empty state handles it
        } catch (err) {
            setError(err.message);
            toast.error('Sync failed: ' + err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // Manual re-sync (user clicks button)
    const handleSync = useCallback(async () => {
        try {
            setIsSyncing(true);
            setError(null);

            const prevCount = games.length;
            await syncPlatform(platform);

            const newData = await getSyncedGames(platform);
            setGames(newData);

            const diff = newData.length - prevCount;
            if (diff > 0) {
                toast.success(`Synced ${diff} new games`);
            } else if (newData.length > 0) {
                toast.info('No new games found');
            } else {
                toast.info('No games found');
            }
        } catch (err) {
            setError(err.message);
            toast.error('Sync failed: ' + err.message);
        } finally {
            setIsSyncing(false);
        }
    }, [platform, games.length, toast, platformName]);


    // ─────────────────────────────────────────────────────────────
    // Game Status Actions (with fade animation)
    // ─────────────────────────────────────────────────────────────

    const updateGameWithFade = useCallback(async (gameId, newStatus, apiCall) => {
        try {
            setFadingIds(prev => new Set([...prev, gameId]));
            await apiCall();

            setTimeout(() => {
                setGames(prev => prev.map(g =>
                    g.id === gameId ? { ...g, status: newStatus } : g
                ));
                setSelectedIds(prev => {
                    const next = new Set(prev);
                    next.delete(gameId);
                    return next;
                });
                setFadingIds(prev => {
                    const next = new Set(prev);
                    next.delete(gameId);
                    return next;
                });
            }, 300);
        } catch (err) {
            setError(err.message);
            setFadingIds(prev => {
                const next = new Set(prev);
                next.delete(gameId);
                return next;
            });
        }
    }, []);

    const handleSkip = useCallback((gameId) => {
        updateGameWithFade(gameId, 'skipped', () =>
            updateSyncedGame(gameId, { status: 'skipped' })
        );
    }, [updateGameWithFade]);

    const handleUnskip = useCallback(async (gameId) => {
        try {
            await updateSyncedGame(gameId, { status: 'pending' });
            setGames(prev => prev.map(g =>
                g.id === gameId ? { ...g, status: 'pending' } : g
            ));
        } catch (err) {
            setError(err.message);
        }
    }, []);

    const handleDelete = useCallback(async (gameId) => {
        try {
            setFadingIds(prev => new Set([...prev, gameId]));
            const { deleteSyncedGame } = await import('../api');
            await deleteSyncedGame(gameId);

            setTimeout(() => {
                setGames(prev => prev.filter(g => g.id !== gameId));
                setSelectedIds(prev => {
                    const next = new Set(prev);
                    next.delete(gameId);
                    return next;
                });
                setFadingIds(prev => {
                    const next = new Set(prev);
                    next.delete(gameId);
                    return next;
                });
            }, 300);
        } catch (err) {
            setError(err.message);
            setFadingIds(prev => {
                const next = new Set(prev);
                next.delete(gameId);
                return next;
            });
        }
    }, []);

    const handleConfirm = useCallback((gameId) => {
        updateGameWithFade(gameId, 'imported', async () => {
            await importSyncedGames([gameId]);
            fetchCollection();
        });
    }, [updateGameWithFade, fetchCollection]);

    // ─────────────────────────────────────────────────────────────
    // Bulk Actions
    // ─────────────────────────────────────────────────────────────

    const handleBulkAction = useCallback(async (action, newStatus) => {
        if (selectedIds.size === 0) return;

        const ids = [...selectedIds];
        setIsProcessing(true);
        setProcessProgress({ current: 0, total: ids.length });

        try {
            setFadingIds(new Set(ids));

            // Progress simulation
            const progressInterval = setInterval(() => {
                setProcessProgress(prev => ({
                    ...prev,
                    current: Math.min(prev.current + 1, prev.total - 1)
                }));
            }, 150);

            await action(ids);

            clearInterval(progressInterval);
            setProcessProgress({ current: ids.length, total: ids.length });

            if (newStatus === 'imported') {
                fetchCollection();
                toast.success(`Successfully imported ${ids.length} games`);
            }

            setTimeout(() => {
                setGames(prev => prev.map(g =>
                    selectedIds.has(g.id) ? { ...g, status: newStatus } : g
                ));
                setSelectedIds(new Set());
                setFadingIds(new Set());
                setIsProcessing(false);
                setProcessProgress({ current: 0, total: 0 });
            }, 300);
        } catch (err) {
            setError(err.message);
            setIsProcessing(false);
            setFadingIds(new Set());
            setProcessProgress({ current: 0, total: 0 });
        }
    }, [selectedIds, fetchCollection, toast]);

    const handleImport = useCallback(() => {
        handleBulkAction(importSyncedGames, 'imported');
    }, [handleBulkAction]);

    const handleBulkSkip = useCallback(() => {
        handleBulkAction(
            (ids) => Promise.all(ids.map(id => updateSyncedGame(id, { status: 'skipped' }))),
            'skipped'
        );
    }, [handleBulkAction]);

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

    // ─────────────────────────────────────────────────────────────
    // Fix Match Modal
    // ─────────────────────────────────────────────────────────────

    const handleFixGame = useCallback((game) => {
        setFixingGame(game);
    }, []);

    const handleGameFixed = useCallback(async (updatedGame) => {
        try {
            // Import immediately since user confirmed the match
            await importSyncedGames([updatedGame.id]);

            // Update in state as imported
            setGames(prev => prev.map(g =>
                g.id === updatedGame.id
                    ? { ...updatedGame, status: 'imported' }
                    : g
            ));

            // Refresh library
            fetchCollection();

            toast.success(`Imported: ${updatedGame.igdb_name}`);
        } catch (err) {
            toast.error(`Failed to import: ${err.message}`);
        }
    }, [toast, fetchCollection]);

    const closeFixModal = useCallback(() => {
        setFixingGame(null);
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Filtering & Computed Values
    // ─────────────────────────────────────────────────────────────

    const filterByTab = useCallback((gamesList, tab) => {
        switch (tab) {
            case 'ready':
                // Ready = has IGDB match (user can verify visually, fix if wrong)
                return gamesList.filter(g =>
                    g.igdb_id &&
                    g.status !== 'imported' &&
                    g.status !== 'skipped'
                );
            case 'unmatched':
                // Unmatched = no IGDB match (user must fix to import)
                return gamesList.filter(g =>
                    !g.igdb_id &&
                    g.status !== 'imported' &&
                    g.status !== 'skipped'
                );
            case 'skipped':
                return gamesList.filter(g => g.status === 'skipped');
            case 'imported':
                return gamesList.filter(g => g.status === 'imported');
            default:
                return gamesList;
        }
    }, []);


    const filteredGames = useMemo(() => {
        let result = games;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(g =>
                g.platform_name?.toLowerCase().includes(query) ||
                g.igdb_name?.toLowerCase().includes(query)
            );
        }

        return filterByTab(result, activeTab);
    }, [games, activeTab, searchQuery, filterByTab]);

    const counts = useMemo(() => ({
        ready: filterByTab(games, 'ready').length,
        unmatched: filterByTab(games, 'unmatched').length,
        skipped: filterByTab(games, 'skipped').length,
        imported: filterByTab(games, 'imported').length,
    }), [games, filterByTab]);

    const selectAllVisible = useCallback(() => {
        const selectableIds = filteredGames
            .filter(g => {
                if (activeTab === 'ready') return g.igdb_id && g.status !== 'imported';
                if (activeTab === 'unmatched') return !g.igdb_id && g.status !== 'imported' && g.status !== 'skipped';
                return false;
            })
            .map(g => g.id);
        setSelectedIds(prev => new Set([...prev, ...selectableIds]));
    }, [filteredGames, activeTab]);

    // ─────────────────────────────────────────────────────────────
    // Import All Ready (One-Click)
    // ─────────────────────────────────────────────────────────────

    const readyGames = useMemo(() => filterByTab(games, 'ready'), [games, filterByTab]);

    const handleImportAllReady = useCallback(async () => {
        if (readyGames.length === 0 || isProcessing) return;

        const ids = readyGames.map(g => g.id);
        setIsProcessing(true);
        setProcessProgress({ current: 0, total: ids.length });

        try {
            setFadingIds(new Set(ids));

            const progressInterval = setInterval(() => {
                setProcessProgress(prev => ({
                    ...prev,
                    current: Math.min(prev.current + 1, prev.total - 1)
                }));
            }, 100);

            await importSyncedGames(ids);

            clearInterval(progressInterval);
            setProcessProgress({ current: ids.length, total: ids.length });

            fetchCollection();

            // Celebration message for big imports
            if (ids.length >= 10) {
                toast.success(`🎉 Imported all ${ids.length} games!`);
            } else {
                toast.success(`Imported ${ids.length} games`);
            }

            setTimeout(() => {
                setGames(prev => prev.map(g =>
                    ids.includes(g.id) ? { ...g, status: 'imported' } : g
                ));
                setSelectedIds(new Set());
                setFadingIds(new Set());
                setIsProcessing(false);
                setProcessProgress({ current: 0, total: 0 });
            }, 300);
        } catch (err) {
            setError(err.message);
            toast.error('Import failed: ' + err.message);
            setIsProcessing(false);
            setFadingIds(new Set());
            setProcessProgress({ current: 0, total: 0 });
        }
    }, [readyGames, isProcessing, fetchCollection, toast]);

    // ─────────────────────────────────────────────────────────────
    // Skip All Review (One-Click)
    // ─────────────────────────────────────────────────────────────

    const unmatchedGames = useMemo(() => filterByTab(games, 'unmatched'), [games, filterByTab]);

    const handleSkipAllUnmatched = useCallback(async () => {
        if (unmatchedGames.length === 0 || isProcessing) return;

        const ids = unmatchedGames.map(g => g.id);
        setIsProcessing(true);
        setProcessProgress({ current: 0, total: ids.length });

        try {
            setFadingIds(new Set(ids));

            const progressInterval = setInterval(() => {
                setProcessProgress(prev => ({
                    ...prev,
                    current: Math.min(prev.current + 1, prev.total - 1)
                }));
            }, 50);

            await Promise.all(ids.map(id => updateSyncedGame(id, { status: 'skipped' })));

            clearInterval(progressInterval);
            setProcessProgress({ current: ids.length, total: ids.length });

            toast.info(`Skipped ${ids.length} games`);

            setTimeout(() => {
                setGames(prev => prev.map(g =>
                    ids.includes(g.id) ? { ...g, status: 'skipped' } : g
                ));
                setSelectedIds(new Set());
                setFadingIds(new Set());
                setIsProcessing(false);
                setProcessProgress({ current: 0, total: 0 });
            }, 300);
        } catch (err) {
            setError(err.message);
            toast.error('Skip failed: ' + err.message);
            setIsProcessing(false);
            setFadingIds(new Set());
            setProcessProgress({ current: 0, total: 0 });
        }
    }, [unmatchedGames, isProcessing, toast]);

    // ─────────────────────────────────────────────────────────────
    // Keyboard Shortcuts
    // ─────────────────────────────────────────────────────────────

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Ctrl/Cmd + A - Select all visible
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                selectAllVisible();
            }

            // Escape - Clear selection
            if (e.key === 'Escape') {
                clearSelection();
            }

            // Enter - Import selected (if on ready tab) or skip (if on unmatched tab)
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
        allGames: games,
        counts,
        readyCount: readyGames.length,
        unmatchedCount: unmatchedGames.length,
        isLoading,
        isSyncing,
        isProcessing,
        processProgress,
        error,
        activeTab,
        searchQuery,
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
        handleFixGame,
        handleGameFixed,
        closeFixModal,
    };
};

export default useSyncReview;
