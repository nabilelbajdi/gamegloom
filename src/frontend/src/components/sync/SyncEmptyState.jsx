// components/sync/SyncEmptyState.jsx
import React from 'react';
import { Gamepad2, Clock, CheckCircle2, Ban, Search } from 'lucide-react';
import './SyncEmptyState.css';

const EMPTY_STATES = {
    ready: {
        icon: Gamepad2,
        title: 'No games ready to import',
        description: 'Games with high-confidence matches will appear here.',
        color: 'primary',
    },
    unmatched: {
        icon: Search,
        title: 'All games matched!',
        description: "Great news — we found matches for all your games.",
        color: 'success',
    },
    skipped: {
        icon: Ban,
        title: 'No skipped games',
        description: 'Games you choose to skip will appear here.',
        color: 'muted',
    },
    imported: {
        icon: CheckCircle2,
        title: 'No imported games yet',
        description: 'Import games from the Ready tab to see them here.',
        color: 'muted',
    },
    search: {
        icon: Search,
        title: 'No results found',
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
