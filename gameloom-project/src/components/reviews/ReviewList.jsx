import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import useReviewStore from "../../store/useReviewStore";
import AddReview from "./AddReview";
import ReviewItem from "./ReviewItem";
import { ChevronDown } from "lucide-react";

const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "oldest", label: "Oldest First" },
  { value: "highest_rating", label: "Highest Rating" },
  { value: "most_liked", label: "Most Liked" },
];

const ReviewList = ({ gameId, releaseDate }) => {
  const { user } = useAuth();
  const { reviews, isLoading, error, fetchGameReviews } = useReviewStore();
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0].value);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const dropdownRef = useRef(null);
  const gameReviews = reviews[gameId] || [];

  // Check if game is released
  const isReleased = releaseDate ? new Date(releaseDate) <= new Date() : true;

  useEffect(() => {
    fetchGameReviews(gameId);
  }, [gameId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSortedReviews = () => {
    return [...gameReviews].sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.created_at) - new Date(a.created_at);
        case "oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        case "highest_rating":
          return b.rating - a.rating;
        case "most_liked":
          return b.likes_count - a.likes_count;
        default:
          return 0;
      }
    });
  };

  const getCurrentSortLabel = () => {
    return SORT_OPTIONS.find((option) => option.value === sortBy)?.label || "Sort By";
  };

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        <div className="h-32 bg-surface animate-pulse rounded-lg"></div>
        <div className="h-32 bg-surface animate-pulse rounded-lg"></div>
      </div>
    );
  }

  const sortedReviews = getSortedReviews();

  return (
    <div className="mt-8 space-y-8">
      {/* Reviews Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Reviews {gameReviews.length > 0 && `(${gameReviews.length})`}
        </h2>
        
        {/* Sort Dropdown */}
        {gameReviews.length > 1 && (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 bg-[#1a1b1e] text-gray-100 hover:bg-gray-800/50 border border-gray-800/50 cursor-pointer"
            >
              {getCurrentSortLabel()}
              <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${showSortMenu ? "rotate-180" : ""}`} />
            </button>

            {showSortMenu && (
              <div 
                className="absolute top-full right-0 w-full mt-1 bg-[#1a1b1e] rounded-lg shadow-lg border border-gray-800/50 overflow-hidden"
              >
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                      sortBy === option.value 
                        ? "text-primary bg-gray-800/50"
                        : "text-gray-100 hover:bg-gray-800/50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      {/* Reviews Section */}
      {!isReleased ? (
        <div className="p-4 bg-surface rounded-lg text-center">
          <p className="text-gray-400">
            This game hasn't been released yet. Reviews will be enabled upon release.
          </p>
        </div>
      ) : (
        <>
          {/* Add Review Section */}
          {user ? (
            <AddReview gameId={gameId} />
          ) : (
            <div className="p-4 bg-surface rounded-lg text-center">
              <p className="text-gray-400">
                Please <a href="/login" className="text-primary hover:underline">sign in</a> to write a review
              </p>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {sortedReviews.length > 0 ? (
              sortedReviews.map(review => (
                <ReviewItem 
                  key={review.id} 
                  review={review}
                  gameId={gameId}
                />
              ))
            ) : (
              <div className="p-4 bg-surface rounded-lg text-center">
                <p className="text-gray-400">
                  No reviews yet. Be the first to review!
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewList; 