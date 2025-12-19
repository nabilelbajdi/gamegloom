// components/sync/SyncTabs.jsx
import React from 'react';
import { RefreshCw, Search, X } from 'lucide-react';
import SortDropdown from '../common/SortDropdown';

const TAB_INFO = {
    ready: { title: 'Ready to Import' },
    unmatched: { title: 'Needs Review' },
    skipped: { title: 'Skipped' },
};

const TAB_DESCRIPTIONS = {
    ready: 'These games have been automatically matched. Please verify them before adding to your library.',
    unmatched: "We couldn't automatically identify these games. Click Fix to search and match them manually.",
    skipped: 'Games you chose to hide from import. You can restore them at any time.',
};

const SyncTabs = ({
    activeTab,
    onTabChange,
    counts,
    searchQuery,
    onSearchChange,
    sortOption,
    onSortChange,
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
                    <SortDropdown
                        sortOption={sortOption}
                        onSortChange={onSortChange}
                        isSyncPage={true}
                    />
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
