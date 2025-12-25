// src/components/reviews/ReviewModal.jsx
import React, { useEffect } from "react";
import { X, Star, Clock, Monitor, ThumbsUp, ThumbsDown, Heart, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Rating labels
const RATING_LABELS = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Great",
    5: "Excellent"
};

// Completion status display mapping
const COMPLETION_LABELS = {
    main_story: "Main Story",
    main_extras: "Main + Extras",
    completionist: "100% Completionist",
    still_playing: "Still Playing",
    dropped: "Dropped",
    endless: "Endless/Multiplayer"
};

const ReviewModal = ({ review, onClose }) => {
    if (!review) return null;

    const { user, rating, content, created_at, likes_count } = review;

    // Lock body scroll and ESC key handler
    useEffect(() => {
        document.body.style.overflow = 'hidden';

        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Handle click outside modal
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-surface-dark rounded-2xl border border-gray-700/50 shadow-2xl">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors cursor-pointer z-10"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="p-6">
                    {/* Header - User & Rating */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user?.username}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.src = "/images/default-avatar.svg"; }}
                                />
                            ) : (
                                <span className="text-lg font-medium text-white">
                                    {user?.username?.[0]?.toUpperCase() || "?"}
                                </span>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-light">{user?.username || "Anonymous"}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={16}
                                            className={star <= rating ? "fill-primary text-primary" : "fill-gray-600 text-gray-600"}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm font-medium text-primary">{RATING_LABELS[rating]}</span>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-sm text-gray-400">
                                    {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Play Info Bar */}
                    {(review.platform || review.playtime_hours || review.completion_status) && (
                        <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-700/50">
                            {review.platform && (
                                <span className="flex items-center gap-1.5 text-sm text-gray-300 bg-surface px-2.5 py-1 rounded-full">
                                    <Monitor size={14} className="text-gray-400" />
                                    {review.platform}
                                </span>
                            )}
                            {review.playtime_hours && (
                                <span className="flex items-center gap-1.5 text-sm text-gray-300 bg-surface px-2.5 py-1 rounded-full">
                                    <Clock size={14} className="text-gray-400" />
                                    {review.playtime_hours} hours
                                </span>
                            )}
                            {review.completion_status && (
                                <span className="text-sm text-gray-300 bg-surface px-2.5 py-1 rounded-full">
                                    {COMPLETION_LABELS[review.completion_status] || review.completion_status}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Category Ratings */}
                    {(review.story_rating || review.gameplay_rating || review.visuals_rating || review.audio_rating || review.performance_rating) && (
                        <div className="grid grid-cols-5 gap-2 mb-4 pb-4 border-b border-gray-700/50">
                            {[
                                { key: 'story_rating', label: 'Story' },
                                { key: 'gameplay_rating', label: 'Gameplay' },
                                { key: 'visuals_rating', label: 'Visuals' },
                                { key: 'audio_rating', label: 'Audio' },
                                { key: 'performance_rating', label: 'Performance' }
                            ].map((category) => review[category.key] && (
                                <div key={category.key} className="text-center">
                                    <div className="text-xs text-gray-400 mb-1">{category.label}</div>
                                    <div className="flex justify-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={10}
                                                className={star <= review[category.key] ? "fill-primary text-primary" : "fill-gray-600 text-gray-600"}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Recommendation Badge */}
                    {review.recommended !== null && review.recommended !== undefined && (
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold mb-4 ${review.recommended
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                            }`}>
                            {review.recommended ? (
                                <>
                                    <ThumbsUp size={16} />
                                    <span>Recommended</span>
                                </>
                            ) : (
                                <>
                                    <ThumbsDown size={16} />
                                    <span>Not Recommended</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Review Content */}
                    <div className="prose prose-invert max-w-none">
                        {content && content.trim().length > 0 ? (
                            <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap m-0">
                                {content}
                            </p>
                        ) : (
                            <p className="text-gray-500 italic m-0">No written review provided.</p>
                        )}
                    </div>

                    {/* Footer - Likes */}
                    <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-700/50 text-sm text-gray-400">
                        <Heart size={16} className={review.user_liked ? "fill-primary text-primary" : ""} />
                        <span>{likes_count} {likes_count === 1 ? "like" : "likes"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
