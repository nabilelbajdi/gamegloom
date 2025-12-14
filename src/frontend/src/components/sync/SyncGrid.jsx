// components/sync/SyncGrid.jsx
import React from 'react';
import SyncGameCard from './SyncGameCard';
import SyncEmptyState from './SyncEmptyState';

const SyncGrid = ({
    games,
    selectedIds,
    fadingIds,
    activeTab,
    searchQuery,
    onSelect,
    onConfirm,
    onSkip,
    onUnskip,
    onDelete,
    onFix,
}) => {
    const showActions = activeTab !== 'imported';

    if (games.length === 0) {
        return (
            <div className="sync-grid">
                <SyncEmptyState
                    tab={activeTab}
                    isSearch={!!searchQuery?.trim()}
                />
            </div>
        );
    }

    return (
        <div className="sync-grid">
            {games.map(game => (
                <SyncGameCard
                    key={game.id}
                    game={game}
                    selected={selectedIds.has(game.id)}
                    fading={fadingIds.has(game.id)}
                    onSelect={onSelect}
                    onConfirm={onConfirm}
                    onSkip={onSkip}
                    onUnskip={onUnskip}
                    onDelete={onDelete}
                    onFix={onFix}
                    showActions={showActions}
                />
            ))}
        </div>
    );
};

export default SyncGrid;
