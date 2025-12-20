// components/sync/SyncHeader.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * Simple header with back link, title, and pending stats.
 * backTo prop allows context-aware navigation (from Settings vs Import hub).
 */
const SyncHeader = ({
    platformName,
    readyCount = 0,
    unmatchedCount = 0,
    backTo = { path: '/sync', label: 'Import Games' },
}) => {
    const totalPending = readyCount + unmatchedCount;

    return (
        <div className="sync-header">
            <Link to={backTo.path} className="sync-back">
                <ChevronLeft size={16} />
                {backTo.label}
            </Link>
            <h1 className="sync-title">{platformName} Library</h1>
            {totalPending > 0 && (
                <p className="sync-subtitle">
                    {totalPending} games ready to import
                </p>
            )}
        </div>
    );
};

export default SyncHeader;
