// src/components/home/ReviewedGames.jsx
import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { getRecentReviews } from "../../api";
import RecentReviewCard from "./RecentReviewCard";
import ReviewModal from "../reviews/ReviewModal";
import { Skeleton } from "../common/Skeleton";
import ErrorState from "../common/ErrorState";
import EmptyState from "../common/EmptyState";

// Section header reused by the success and empty states.
const ReviewsHeader = () => (
  <header className="mb-8 md:mb-12 space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-12 h-px bg-gradient-to-r from-primary to-transparent" />
      <span className="text-sm uppercase tracking-[0.3em] text-primary font-medium">
        Fresh Takes
      </span>
    </div>
    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
      Community Voices
    </h2>
    <p className="text-lg text-light/60 max-w-xl">
      See what players are saying about the games they love.
    </p>
  </header>
);

// Wrapper that keeps the Community Voices section chrome consistent across states.
const ReviewsSection = ({ children }) => (
  <section className="py-16 md:py-20 relative overflow-hidden border-t border-[var(--border-subtle)]">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-elevated-1)]/30 to-transparent pointer-events-none" />
    <div className="container mx-auto px-4 md:px-6 relative z-10">{children}</div>
  </section>
);

const ReviewedGames = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecentReviews();
      setReviews(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  if (loading) {
    return (
      <ReviewsSection>
        <header className="mb-8 md:mb-12 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-5 w-80" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="bg-surface-dark rounded-xl overflow-hidden">
              <div className="flex gap-4 h-[180px]">
                <Skeleton className="w-[120px] rounded-none" />
                <div className="flex-1 p-4">
                  <div className="flex justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ReviewsSection>
    );
  }

  if (error) {
    return (
      <ReviewsSection>
        <ErrorState message="Couldn't load community reviews." onRetry={fetchReviews} />
      </ReviewsSection>
    );
  }

  return (
    <>
      <ReviewsSection>
        <ReviewsHeader />
        {reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No reviews yet"
            message="Be the first to share your thoughts on a game."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <RecentReviewCard
                key={review.id}
                review={review}
                onViewReview={setSelectedReview}
              />
            ))}
          </div>
        )}
      </ReviewsSection>

      {/* Review Modal */}
      {selectedReview && (
        <ReviewModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}
    </>
  );
};

export default ReviewedGames;

