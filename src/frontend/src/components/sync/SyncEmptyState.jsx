// components/sync/SyncEmptyState.jsx
import React from 'react';
import { CheckCircle2, Ban, Search } from 'lucide-react';
import './SyncEmptyState.css';

const EMPTY_STATES = {
    ready: {
        icon: CheckCircle2,
        title: 'All done!',
        description: "You've imported all matched games.",
        color: 'success',
    },
    unmatched: {
        icon: CheckCircle2,
        title: 'No games need review',
        description: 'All your games were matched successfully.',
        color: 'success',
    },
    skipped: {
        icon: Ban,
        title: 'No skipped games',
        description: 'Games you skip will appear here.',
        color: 'muted',
    },
    search: {
        icon: Search,
        title: 'No results',
        description: 'Try a different search term.',
        color: 'muted',
    },
};

const SyncEmptyState = ({ tab, isSearch = false }) => {
    const state = isSearch ? EMPTY_STATES.search : EMPTY_STATES[tab] || EMPTY_STATES.ready;
    const Icon = state.icon;

    return (
        <div className={`sync-empty-state sync-empty-${state.color}`}>
            <div className="sync-empty-icon">
                <Icon size={32} strokeWidth={1.5} />
            </div>
            <h3 className="sync-empty-title">{state.title}</h3>
            <p className="sync-empty-description">{state.description}</p>
        </div>
    );
};

export default SyncEmptyState;
