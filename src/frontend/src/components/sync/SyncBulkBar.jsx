// components/sync/SyncBulkBar.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Bulk action bar - shows when games are selected.
 * Ready tab: [Clear] ... [Import all X] [Import Y games]
 * Review tab: [Clear] ... [Skip all X] [Skip Y games]
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
    // Only show when there's a selection
    if (selectedCount === 0) return null;

    return (
        <div className="sync-bulk-bar">
            <div className="sync-bulk-left">
                <button className="sync-bulk-clear" onClick={onClear}>
                    Clear
                </button>
            </div>

            <div className="sync-bulk-actions">
                {/* Import all - only on Ready tab */}
                {showImport && readyCount > selectedCount && (
                    <button
                        className="sync-bulk-link"
                        onClick={onImportAll}
                        disabled={isProcessing}
                    >
                        Import all {readyCount}
                    </button>
                )}

                {/* Skip all - only on Unmatched tab */}
                {showSkip && unmatchedCount > selectedCount && (
                    <button
                        className="sync-bulk-link"
                        onClick={onSkipAll}
                        disabled={isProcessing}
                    >
                        Skip all {unmatchedCount}
                    </button>
                )}

                {/* Import selected */}
                {showImport && (
                    <button
                        onClick={onImport}
                        disabled={isProcessing}
                        className="sync-bulk-primary"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Importing {processProgress.current}/{processProgress.total}...</span>
                            </>
                        ) : (
                            <span>Import {selectedCount}</span>
                        )}
                    </button>
                )}

                {/* Skip selected */}
                {showSkip && (
                    <button
                        onClick={onSkip}
                        disabled={isProcessing}
                        className="sync-bulk-secondary"
                    >
                        {isProcessing ? 'Skipping...' : `Skip ${selectedCount}`}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SyncBulkBar;
