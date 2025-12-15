// components/sync/SyncHeader.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * Simple header with back link, title, and pending stats.
 */
const SyncHeader = ({
    platformName,
    readyCount = 0,
    unmatchedCount = 0,
}) => {
    const totalPending = readyCount + unmatchedCount;

    return (
        <div className="sync-header">
            <Link to="/settings?tab=integrations" className="sync-back">
                <ChevronLeft size={16} />
                Settings
            </Link>
            <h1 className="sync-title">{platformName} Library</h1>
            {totalPending > 0 && (
                <p className="sync-subtitle">
                    {totalPending} games to review
                </p>
            )}
        </div>
    );
};

export default SyncHeader;
