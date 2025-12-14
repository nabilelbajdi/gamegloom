// components/sync/SyncHeader.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * Simple header with back link, title, and stats.
 * Import All moved to bulk bar for minimal design.
 */
const SyncHeader = ({
    platformName,
    readyCount,
    unmatchedCount,
    importedCount,
}) => {
    const totalPending = readyCount + unmatchedCount;

    return (
        <div className="sync-header">
            <Link to="/settings?tab=integrations" className="sync-back">
                <ChevronLeft size={16} />
                Settings
            </Link>
            <h1 className="sync-title">{platformName} Library</h1>
            <p className="sync-subtitle">
                {totalPending} games · {importedCount} imported
            </p>
        </div>
    );
};

export default SyncHeader;
