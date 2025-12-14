// components/sync/SyncCardSkeleton.jsx
import React from 'react';
import './SyncCardSkeleton.css';

/**
 * Skeleton placeholder for SyncGameCard during loading.
 * Includes shimmer animation for premium feel.
 */
const SyncCardSkeleton = () => {
    return (
        <div className="sync-card-skeleton">
            <div className="skeleton-cover shimmer" />
            <div className="skeleton-info">
                <div className="skeleton-title shimmer" />
                <div className="skeleton-subtitle shimmer" />
            </div>
        </div>
    );
};

/**
 * Renders a grid of skeleton cards
 */
export const SyncGridSkeleton = ({ count = 10 }) => {
    return (
        <div className="sync-grid">
            {Array.from({ length: count }).map((_, i) => (
                <SyncCardSkeleton key={i} />
            ))}
        </div>
    );
};

export default SyncCardSkeleton;
