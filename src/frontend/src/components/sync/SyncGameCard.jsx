// components/sync/SyncGameCard.jsx
import React from 'react';
import { Check, X, RotateCcw, Wrench } from 'lucide-react';
import './SyncGameCard.css';

/**
 * Grid card for synced games with hover actions.
 */
const SyncGameCard = ({
    game,
    selected = false,
    fading = false,
    onSelect,
    onConfirm,
    onSkip,
    onUnskip,
    onDelete,
    onFix,
    showActions = true,
}) => {
    const isMatched = !!game.igdb_id;
    const isImported = game.status === 'imported';
    const isSkipped = game.status === 'skipped';
    const isHidden = game.status === 'hidden';
    const isInactive = isSkipped || isHidden; // Games that need restore action

    // Use IGDB data for matched games, PSN data for unmatched
    const useIgdbCover = isMatched && game.igdb_cover_url;
    const coverUrl = isMatched
        ? (game.igdb_cover_url || game.image_url)
        : game.image_url;
    const displayName = isMatched ? game.igdb_name : game.platform_name;

    const handleCardClick = (e) => {
        if (isImported || isInactive) return;
        if (e.target.closest('.sync-card-action')) return;
        onSelect?.(game.id);
    };

    const handleConfirm = (e) => {
        e.stopPropagation();
        onConfirm?.(game.id);
    };

    const handleSkip = (e) => {
        e.stopPropagation();
        onSkip?.(game.id);
    };

    const handleUnskip = (e) => {
        e.stopPropagation();
        onUnskip?.(game.id);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete?.(game.id);
    };

    const handleFix = (e) => {
        e.stopPropagation();
        onFix?.(game);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isImported && !isInactive) {
                onSelect?.(game.id);
            }
        }
    };

    return (
        <div
            className={`sync-card ${selected ? 'selected' : ''} ${isImported ? 'imported' : ''} ${isInactive ? 'skipped' : ''} ${!isMatched ? 'unmatched' : ''} ${fading ? 'fading' : ''}`}
            onClick={handleCardClick}
            onKeyDown={handleKeyDown}
            tabIndex={isImported ? -1 : 0}
            role="button"
            aria-pressed={selected}
        >
            {/* Cover - different aspect ratio for IGDB (portrait) vs PSN (square) */}
            <div className={`sync-card-cover ${useIgdbCover ? 'igdb-cover' : 'psn-cover'}`}>
                {coverUrl ? (
                    <img src={coverUrl} alt={game.platform_name} loading="lazy" />
                ) : (
                    <div className="sync-card-no-cover">
                        <span>{game.platform_name?.charAt(0)}</span>
                    </div>
                )}

                {/* Playtime badge */}
                {game.playtime_minutes > 0 && (
                    <div className="sync-card-playtime">
                        {game.playtime_minutes >= 60
                            ? `${Math.floor(game.playtime_minutes / 60)}h`
                            : `${game.playtime_minutes}m`
                        }
                    </div>
                )}

                {/* Platform category badge (PS4/PS5) */}
                {game.platform_category && (
                    <div className="sync-card-badge">
                        {game.platform_category.toUpperCase().replace(',', '/')}
                    </div>
                )}

                {/* Selected check */}
                {selected && (
                    <div className="sync-card-check">
                        <Check size={12} />
                    </div>
                )}

                {/* Hover overlay - actions for active games */}
                {showActions && !isImported && !isInactive && (
                    <div className="sync-card-overlay">
                        {/* Import button - only for matched games */}
                        {isMatched && (
                            <button
                                className="sync-card-action confirm"
                                onClick={handleConfirm}
                                title="Import"
                            >
                                <Check size={16} />
                                <span>Import</span>
                            </button>
                        )}
                        {/* Fix button - for all games (find/correct match) */}
                        <button
                            className="sync-card-action fix"
                            onClick={handleFix}
                            title="Search for match"
                        >
                            <Wrench size={16} />
                            <span>Fix</span>
                        </button>
                        <button
                            className="sync-card-action skip"
                            onClick={handleSkip}
                            title="Skip"
                        >
                            <X size={16} />
                            <span>Skip</span>
                        </button>
                    </div>
                )}

                {/* Hover overlay - restore for hidden/skipped games */}
                {isInactive && (
                    <div className="sync-card-overlay skipped-overlay">
                        <button
                            className="sync-card-action restore"
                            onClick={handleUnskip}
                            title="Restore"
                        >
                            <RotateCcw size={16} />
                            <span>Restore</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Title below card */}
            <div className="sync-card-info">
                <div className="sync-card-title" title={displayName}>
                    {displayName}
                </div>
            </div>
        </div>
    );
};

export default SyncGameCard;
