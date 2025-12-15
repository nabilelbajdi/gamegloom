// pages/SyncReviewPage.jsx
import React, { useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import useSyncReview from '../hooks/useSyncReview';
import SyncHeader from '../components/sync/SyncHeader';
import SyncTabs from '../components/sync/SyncTabs';
import SyncGrid from '../components/sync/SyncGrid';
import SyncBulkBar from '../components/sync/SyncBulkBar';
import FixMatchModal from '../components/sync/FixMatchModal';
import { SyncGridSkeleton } from '../components/sync/SyncCardSkeleton';
import './SyncReviewPage.css';

/**
 * Game imports page - review synced games before adding to library.
 * Auto-sync only triggers when navigating with triggerSync state (post-link).
 */
const SyncReviewPage = () => {
    const { platform } = useParams();
    const location = useLocation();
    const autoSyncTriggered = useRef(false);

    const {
        // State
        games,
        counts,
        isLoading,
        isSyncing,
        isProcessing,
        processProgress,
        error,
        needsSync,
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
        clearSelection,
        setActiveTab,
        setSearchQuery,
        handleFixGame,
        handleGameFixed,
        closeFixModal,
    } = useSyncReview(platform);

    // Auto-sync when navigating here after linking (triggerSync state)
    useEffect(() => {
        if (location.state?.triggerSync && !autoSyncTriggered.current && !isSyncing) {
            autoSyncTriggered.current = true;
            handleSync();
            window.history.replaceState({}, document.title);
        }
    }, [location.state, handleSync, isSyncing]);

    if (isLoading) {
        return (
            <div className="sync-page">
                <div className="sync-container">
                    <div className="sync-header">
                        <div className="skeleton-back shimmer" style={{ width: 80, height: 16, borderRadius: 4 }} />
                        <div className="skeleton-title shimmer" style={{ width: 200, height: 28, marginTop: 8, borderRadius: 6 }} />
                        <div className="skeleton-subtitle shimmer" style={{ width: 140, height: 14, marginTop: 8, borderRadius: 4 }} />
                    </div>
                    <SyncGridSkeleton count={10} />
                </div>
            </div>
        );
    }

    // Syncing state - show spinner
    if (isSyncing) {
        return (
            <div className="sync-page">
                <div className="sync-container">
                    <div className="sync-empty-state">
                        <Loader2 className="sync-empty-icon animate-spin" size={48} />
                        <h2>Syncing your {platformName} library…</h2>
                        <p>This may take a minute. Feel free to explore the app — we'll have your games ready when you return.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Empty state - no sync run yet
    if (needsSync) {
        return (
            <div className="sync-page">
                <div className="sync-container">
                    <div className="sync-empty-state">
                        <RefreshCw className="sync-empty-icon" size={48} />
                        <h2>No games to import yet</h2>
                        <p>Sync your {platformName} library to see your games here.</p>
                        <button
                            onClick={handleSync}
                            className="sync-empty-button"
                        >
                            Sync Library
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Check if library is up to date (synced but no pending games)
    const totalPending = counts.ready + counts.unmatched;
    const isUpToDate = totalPending === 0 && counts.skipped === 0;

    // Up to date state - synced but nothing to do
    if (isUpToDate) {
        return (
            <div className="sync-page">
                <div className="sync-container">
                    <div className="sync-empty-state">
                        <CheckCircle2 className="sync-empty-icon sync-empty-success" size={48} />
                        <h2>Your library is up to date</h2>
                        <p>All your {platformName} games have been imported. Check back after playing new games.</p>
                        <button
                            onClick={handleSync}
                            className="sync-empty-button secondary"
                        >
                            Re-sync Library
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const showImport = activeTab === 'ready';
    const showSkip = activeTab === 'unmatched';

    return (
        <div className="sync-page">
            <div className="sync-container">
                <SyncHeader
                    platformName={platformName}
                    readyCount={counts.ready}
                    unmatchedCount={counts.unmatched}
                />

                {error && (
                    <div className="sync-error">
                        <p>{error}</p>
                    </div>
                )}

                <SyncTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    counts={counts}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    isSyncing={isSyncing}
                    onSync={handleSync}
                    needsSync={needsSync}
                />

                <SyncGrid
                    games={games}
                    selectedIds={selectedIds}
                    fadingIds={fadingIds}
                    activeTab={activeTab}
                    searchQuery={searchQuery}
                    onSelect={toggleSelect}
                    onConfirm={handleConfirm}
                    onSkip={handleSkip}
                    onUnskip={handleUnskip}
                    onDelete={handleDelete}
                    onFix={handleFixGame}
                />

                <SyncBulkBar
                    selectedCount={selectedIds.size}
                    readyCount={counts.ready}
                    unmatchedCount={counts.unmatched}
                    onClear={clearSelection}
                    onImport={handleImport}
                    onImportAll={handleImportAllReady}
                    onSkip={handleBulkSkip}
                    onSkipAll={handleSkipAllUnmatched}
                    isProcessing={isProcessing}
                    processProgress={processProgress}
                    showImport={showImport}
                    showSkip={showSkip}
                />

                {fixingGame && (
                    <FixMatchModal
                        game={fixingGame}
                        onClose={closeFixModal}
                        onFixed={handleGameFixed}
                    />
                )}
            </div>
        </div>
    );
};

export default SyncReviewPage;
