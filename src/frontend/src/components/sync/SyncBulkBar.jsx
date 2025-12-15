// components/sync/SyncBulkBar.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Bulk action bar - shows when games are selected OR when there are games to import/skip.
 * Actions grouped on the right.
 */
const SyncBulkBar = ({
    selectedCount,
    readyCount,
    unmatchedCount,
    onClear,
    onImport,
    onImportAll,
    onSkip,
    onSkipAll,
    isProcessing,
    processProgress,
    showImport,
    showSkip,
}) => {
    // Show bar if there's a selection OR if there are ready games to import all
    const hasReadyGames = showImport && readyCount > 0;
    const hasUnmatchedGames = showSkip && unmatchedCount > 0;

    if (selectedCount === 0 && !hasReadyGames && !hasUnmatchedGames) return null;

    return (
        <div className="sync-bulk-bar">
            <div className="sync-bulk-actions">
                {/* Clear - only show when there's a selection */}
                {selectedCount > 0 && (
                    <button className="sync-bulk-clear" onClick={onClear}>
                        Clear
                    </button>
                )}

                {/* Import all - on Ready tab when there are ready games */}
                {showImport && readyCount > 0 && (
                    <button
                        className="sync-bulk-link"
                        onClick={() => {
                            onImportAll();
                            onClear(); // Clear selection after import all
                        }}
                        disabled={isProcessing}
                    >
                        Import all {readyCount}
                    </button>
                )}

                {/* Skip all - on Unmatched tab when there are unmatched games */}
                {showSkip && unmatchedCount > 0 && (
                    <button
                        className="sync-bulk-link"
                        onClick={() => {
                            onSkipAll();
                            onClear();
                        }}
                        disabled={isProcessing}
                    >
                        Skip all {unmatchedCount}
                    </button>
                )}

                {/* Import selected - only when there's a selection */}
                {showImport && selectedCount > 0 && (
                    <button
                        onClick={onImport}
                        disabled={isProcessing}
                        className="sync-bulk-primary"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Importing {processProgress.current}/{processProgress.total}…</span>
                            </>
                        ) : (
                            <span>Import {selectedCount}</span>
                        )}
                    </button>
                )}

                {/* Skip selected - only when there's a selection */}
                {showSkip && selectedCount > 0 && (
                    <button
                        onClick={onSkip}
                        disabled={isProcessing}
                        className="sync-bulk-secondary"
                    >
                        {isProcessing ? 'Skipping…' : `Skip ${selectedCount}`}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SyncBulkBar;
