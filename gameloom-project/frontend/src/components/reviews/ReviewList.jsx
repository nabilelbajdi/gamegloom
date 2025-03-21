import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import useReviewStore from "../../store/useReviewStore";
import ReviewItem from "./ReviewItem";
import { ChevronDown } from "lucide-react";

const SORT_OPTIONS = [
  { value: "newest", label: "Recent" },
  { value: "oldest", label: "Oldest" },
  { value: "popular", label: "Popular" },
];

const ReviewList = ({ gameId, releaseDate }) => {
  const { user } = useAuth();
  const { reviews, isLoading, error, fetchGameReviews } = useReviewStore();
  const [sortBy, setSortBy] = useState("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const dropdownRef = useRef(null);
  const gameReviews = reviews[gameId] || [];

  // Add a tracking state for initial load vs subsequent loads
  const [initialLoad, setInitialLoad] = useState(true);

  const isReleased = releaseDate ? new Date(releaseDate) <= new Date() : true;

  useEffect(() => {
    const fetchReviews = async () => {
      await fetchGameReviews(gameId);
      setInitialLoad(false);
    };
    
    fetchReviews();
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
    if (!gameReviews) return [];
    
    // Filter out reviews that don't have content
    const reviewsWithContent = gameReviews.filter(review => 
      review.content && review.content.trim().length > 0
    );
    
    const reviewsToSort = [...reviewsWithContent];
    
    switch(sortBy) {
      case "newest":
        return reviewsToSort.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case "oldest":
        return reviewsToSort.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case "popular":
        return reviewsToSort.sort((a, b) => b.likes_count - a.likes_count);
      default:
        return reviewsToSort;
    }
  };

  const getCurrentSortLabel = () => {
    return SORT_OPTIONS.find((option) => option.value === sortBy)?.label || "Sort By";
  };

  // Only show loading state on initial load, not for ratings updates
  if (isLoading && initialLoad) {
    return (
      <div className="mt-8 space-y-4">
        <div className="h-32 bg-surface-dark animate-pulse rounded-lg"></div>
        <div className="h-32 bg-surface-dark animate-pulse rounded-lg"></div>
      </div>
    );
  }

  const sortedReviews = getSortedReviews();
  
  return (
    <div className="mt-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Reviews {sortedReviews.length > 0 && `(${sortedReviews.length})`}
        </h2>
        
        {/* Sort Dropdown */}
        {sortedReviews.length > 1 && (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 bg-surface-dark text-gray-100 hover:bg-gray-800/50 border border-gray-800/50 cursor-pointer"
            >
              {getCurrentSortLabel()}
              <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${showSortMenu ? "rotate-180" : ""}`} />
            </button>

            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 py-1 bg-surface-dark rounded-lg shadow-lg border border-gray-800/50 z-10">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors duration-200 ${
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

      {/* Reviews Content */}
      {!isReleased ? (
        <div className="p-4 bg-surface-dark rounded-lg text-center">
          <p className="text-gray-400">
            This game hasn't been released yet. Reviews will be enabled upon release.
          </p>
        </div>
      ) : (
        <>
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
              <div className="p-4 bg-surface-dark rounded-lg text-center">
                <p className="text-gray-400">
                  No written reviews yet. Be the first to share your detailed thoughts!
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