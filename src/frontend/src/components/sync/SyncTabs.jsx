// components/sync/SyncTabs.jsx
import React from 'react';
import { RefreshCw, Search, X } from 'lucide-react';

const TAB_INFO = {
    ready: { title: 'Ready to Import' },
    unmatched: { title: 'Needs Review' },
    skipped: { title: 'Skipped' },
};

const TAB_DESCRIPTIONS = {
    ready: 'Matched to our database. Verify the cover looks right, then import.',
    unmatched: "Couldn't find a match. Use Fix to search for the correct game.",
    skipped: 'Games you chose to skip. Hover to restore or remove.',
};

const SyncTabs = ({
    activeTab,
    onTabChange,
    counts,
    searchQuery,
    onSearchChange,
    isSyncing,
    onSync,
}) => {
    return (
        <>
            <div className="sync-tabs-row">
                <div className="sync-tabs">
                    {Object.keys(TAB_INFO).map(key => (
                        <button
                            key={key}
                            className={`sync-tab ${activeTab === key ? 'active' : ''} ${key === 'skipped' ? 'secondary' : ''}`}
                            onClick={() => onTabChange(key)}
                        >
                            {TAB_INFO[key].title} <span>{counts[key]}</span>
                        </button>
                    ))}
                </div>

                <div className="sync-tabs-actions">
                    <div className="sync-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => onSearchChange('')}>
                                <X size={12} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onSync}
                        disabled={isSyncing}
                        className="sync-action-link"
                    >
                        <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Syncing...' : 'Re-sync'}
                    </button>
                </div>
            </div>

            <p className="sync-tab-description">{TAB_DESCRIPTIONS[activeTab]}</p>
        </>
    );
};

export default SyncTabs;
