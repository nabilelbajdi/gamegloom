// components/sync/FixMatchModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Loader2, Check } from 'lucide-react';
import { searchGames, updateSyncedGame } from '../../api';
import debounce from 'lodash/debounce';
import './FixMatchModal.css';

/**
 * Immersive full-screen modal for manually matching games.
 * Blurred overlay with floating search and cover grid.
 */
const FixMatchModal = ({ game, onClose, onFixed }) => {
    const [searchQuery, setSearchQuery] = useState(game?.platform_name || '');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Debounced search
    const debouncedSearch = useCallback(
        debounce(async (query) => {
            if (!query.trim()) {
                setResults([]);
                setIsSearching(false);
                return;
            }

            try {
                const data = await searchGames(query, 'games', 15);
                setResults(data);
            } catch (err) {
                console.error('Search error:', err);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 400),
        []
    );

    // Initial search on mount
    useEffect(() => {
        if (searchQuery.trim()) {
            setIsSearching(true);
            debouncedSearch(searchQuery);
        }
    }, []);

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        setIsSearching(true);
        debouncedSearch(query);
    };

    const handleSelect = (igdbId) => {
        setSelectedId(selectedId === igdbId ? null : igdbId);
    };

    const handleConfirm = async () => {
        if (!selectedId) return;

        try {
            setIsSubmitting(true);
            setError(null);

            const selectedGame = results.find(r => r.igdb_id === selectedId);
            await updateSyncedGame(game.id, { igdb_id: selectedId });

            onFixed({
                ...game,
                igdb_id: selectedId,
                igdb_name: selectedGame?.name,
                match_confidence: 1.0,
                match_method: 'manual',
                status: 'pending'
            });
            onClose();
        } catch (err) {
            setError(err.message);
            setIsSubmitting(false);
        }
    };

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Generate cover URL - already full URL, just change size
    const getCoverUrl = (result) => {
        const coverUrl = result.cover_image || result.coverImage;
        if (!coverUrl) return null;
        // Replace any size specifier with t_1080p for best quality
        return coverUrl.replace(/\/t_[^/]+\//, '/t_1080p/');
    };

    // Dynamic grid class based on result count
    const getGridClass = () => {
        const count = results.length;
        if (count === 1) return 'fix-results grid-1';
        if (count === 2) return 'fix-results grid-2';
        if (count === 3) return 'fix-results grid-3';
        if (count === 4) return 'fix-results grid-4';
        return 'fix-results grid-5';
    };

    return (
        <div className="fix-overlay" onClick={onClose}>
            {/* Floating search bar at top */}
            <div className="fix-search-container" onClick={e => e.stopPropagation()}>
                <div className="fix-search-bar">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder={`Search for "${game?.platform_name}"...`}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        autoFocus
                    />
                    {isSearching && <Loader2 size={18} className="animate-spin" />}
                    <button className="fix-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <p className="fix-hint">
                    Select the correct match for this game
                </p>
            </div>

            {error && (
                <p className="fix-error">{error}</p>
            )}

            {/* Results grid */}
            <div className={getGridClass()} onClick={e => e.stopPropagation()}>
                {results.length === 0 && !isSearching && searchQuery && (
                    <p className="fix-empty">No games found</p>
                )}

                {results.map(result => (
                    <div
                        key={result.igdb_id}
                        className={`fix-card ${selectedId === result.igdb_id ? 'selected' : ''}`}
                        onClick={() => handleSelect(result.igdb_id)}
                    >
                        <div className="fix-card-cover">
                            {getCoverUrl(result) ? (
                                <img
                                    src={getCoverUrl(result)}
                                    alt={result.name}
                                    loading="lazy"
                                />
                            ) : (
                                <div className="fix-card-no-cover">
                                    {result.name?.charAt(0)}
                                </div>
                            )}

                            {selectedId === result.igdb_id && (
                                <div className="fix-card-check">
                                    <Check size={20} />
                                </div>
                            )}
                        </div>

                        <div className="fix-card-info">
                            <span className="fix-card-name" title={result.name}>{result.name}</span>
                            {result.first_release_date && (
                                <span className="fix-card-year">
                                    {new Date(result.first_release_date).getFullYear()}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating confirm button */}
            {selectedId && (
                <div className="fix-confirm-bar" onClick={e => e.stopPropagation()}>
                    <span className="fix-confirm-label">
                        {results.find(r => r.igdb_id === selectedId)?.name}
                    </span>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="fix-confirm-btn"
                    >
                        {isSubmitting ? 'Saving...' : 'Confirm Match'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default FixMatchModal;
