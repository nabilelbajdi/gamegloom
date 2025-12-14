// pages/SyncReviewPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import useSyncReview from '../hooks/useSyncReview';
import SyncHeader from '../components/sync/SyncHeader';
import SyncTabs from '../components/sync/SyncTabs';
import SyncGrid from '../components/sync/SyncGrid';
import SyncBulkBar from '../components/sync/SyncBulkBar';
import FixMatchModal from '../components/sync/FixMatchModal';
import { SyncGridSkeleton } from '../components/sync/SyncCardSkeleton';
import './SyncReviewPage.css';

/**
 * Sync Review Page
 * 
 * Displays games synced from external platforms (PSN/Steam) and allows
 * users to review, import, skip, or fix matches before adding to library.
 */
const SyncReviewPage = () => {
    const { platform } = useParams();

    const {
        // State
        games,
        counts,
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
    } = useSyncReview(platform);

    // Loading state - show skeleton grid
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

    const showImport = activeTab === 'ready';
    const showSkip = activeTab === 'unmatched';

    return (
        <div className="sync-page">
            <div className="sync-container">
                <SyncHeader
                    platformName={platformName}
                    readyCount={counts.ready}
                    unmatchedCount={counts.unmatched}
                    importedCount={counts.imported}
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
            </div>

            {fixingGame && (
                <FixMatchModal
                    game={fixingGame}
                    onClose={closeFixModal}
                    onFixed={handleGameFixed}
                />
            )}
        </div>
    );
};

export default SyncReviewPage;
