import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import useReviewStore from "../../store/useReviewStore";
import { Heart, Trash2, Calendar, MoreHorizontal, Star, User, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ReviewItem = ({ review, gameId, onViewFull }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasMoreLines, setHasMoreLines] = useState(false);
  const contentRef = useRef(null);
  const { user } = useAuth();
  const { toggleLike, deleteReview } = useReviewStore();



  useEffect(() => {
    const checkLines = () => {
      const element = contentRef.current;
      if (!element) return;

      element.style.height = "auto";
      const style = window.getComputedStyle(element);
      const lineHeight = parseInt(style.lineHeight);
      const height = element.scrollHeight;

      setHasMoreLines(height > lineHeight * 3);
    };

    const timer = setTimeout(checkLines, 0);

    window.addEventListener("resize", checkLines);
    return () => {
      window.removeEventListener("resize", checkLines);
      clearTimeout(timer);
    };
  }, [review.content]);

  const isReviewEdited = () => {
    const createdAt = new Date(review.created_at).getTime();
    const updatedAt = new Date(review.updated_at).getTime();
    return Math.abs(updatedAt - createdAt) > 1000;
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      await toggleLike(review.id, gameId);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleDeleteReview = async () => {
    try {
      await deleteReview(review.id, gameId);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  return (
    <div className="bg-[#1a1b1e] p-6 rounded-lg space-y-4 border border-gray-800/50 shadow-lg relative">
      {/* Your Review Badge */}
      {user && user.id === review.user_id && (
        <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
          <div className="bg-primary text-black text-xs font-bold px-2 py-0.5 rounded-full flex items-center">
            <User size={12} className="mr-1" />
            You
          </div>
        </div>
      )}

      {/* Review Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
            {review.user?.avatar ? (
              <img
                src={review.user.avatar}
                alt={`${review.user?.username}'s avatar`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "/images/default-avatar.svg";
                }}
              />
            ) : (
              <span className="text-xl font-medium text-white">
                {review.user?.username?.[0]?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-medium mb-1">{review.user?.username || "Anonymous"}</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={`${star <= review.rating ? "text-primary fill-primary" : "text-gray-600 fill-gray-600"
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Delete button for review owner */}
        {user && user.id === review.user_id && (
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-1.5 text-gray-400 hover:text-gray-300 transition-colors rounded-full hover:bg-gray-800/50 cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showActionsMenu && (
              <div className="absolute top-full right-0 mt-1 w-32 bg-[#1a1b1e] rounded-lg shadow-lg border border-gray-800/50 overflow-hidden z-10">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowActionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}

            {showDeleteConfirm && (
              <div className="absolute top-full right-0 mt-1 p-3 w-48 bg-[#1a1b1e] rounded-lg shadow-lg border border-gray-800/50 z-10">
                <p className="text-sm text-gray-400 mb-2">Delete this review?</p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteReview}
                    className="px-2 py-1 text-xs text-red-700 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Content */}
      <div>
        {review.content && review.content.trim().length > 0 ? (
          <>
            <p
              ref={contentRef}
              className={`text-sm text-gray-300 ${!isExpanded ? "line-clamp-3" : ""}`}
            >
              {review.content}
            </p>
            {/* Actions row */}
            <div className="flex items-center gap-3 mt-2">
              {hasMoreLines && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-primary hover:text-primary/90 transition-colors cursor-pointer"
                >
                  {isExpanded ? "Show Less" : "Show More"}
                </button>
              )}
              {hasMoreLines && onViewFull && (
                <span className="text-gray-600">•</span>
              )}
              {onViewFull && (
                <button
                  onClick={onViewFull}
                  className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors cursor-pointer"
                >
                  View full review <ExternalLink size={12} />
                </button>
              )}
            </div>
          </>
        ) : (
          // Rating-only review - show message and any details
          <div className="space-y-2">
            <p className="text-sm text-gray-500 italic">No review content provided.</p>
            {(review.platform || review.playtime_hours) && (
              <div className="flex flex-wrap items-center gap-2">
                {review.platform && (
                  <span className="text-xs text-gray-400 bg-surface px-2 py-0.5 rounded-full">{review.platform}</span>
                )}
                {review.playtime_hours && (
                  <span className="text-xs text-gray-400 bg-surface px-2 py-0.5 rounded-full">{review.playtime_hours}h played</span>
                )}
                {onViewFull && (review.completion_status || review.recommended !== null || review.story_rating || review.gameplay_rating) && (
                  <button
                    onClick={onViewFull}
                    className="text-xs text-primary hover:text-primary/90 transition-colors cursor-pointer"
                  >
                    View details
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Actions */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-700/50">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>
            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            {isReviewEdited() && (
              <span className="ml-1 italic text-gray-500">(edited {formatDistanceToNow(new Date(review.updated_at), { addSuffix: true })})</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm cursor-pointer ${review.user_liked ? "text-primary" : "text-gray-400 hover:text-primary"
              } transition-colors`}
          >
            <Heart className="w-3.5 h-3.5" fill={review.user_liked ? "currentColor" : "none"} />
            <span>{review.likes_count}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewItem; 