// src/components/home/ReviewedGames.jsx
import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { getRecentReviews } from "../../api";
import RecentReviewCard from "./RecentReviewCard";
import ReviewModal from "../reviews/ReviewModal";
import SectionHeader from "../common/SectionHeader";

const ReviewedGames = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getRecentReviews();
        setReviews(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-20 relative overflow-hidden border-t border-[var(--border-subtle)]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-elevated-1)]/30 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <header className="mb-8 md:mb-12 space-y-4">
            <div className="h-4 bg-gray-700 rounded w-32 animate-pulse" />
            <div className="h-12 bg-gray-700 rounded w-64 animate-pulse" />
            <div className="h-5 bg-gray-700 rounded w-80 animate-pulse" />
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="animate-pulse bg-surface-dark rounded-xl overflow-hidden">
                <div className="flex gap-4 h-[180px]">
                  <div className="w-[120px] bg-gray-700"></div>
                  <div className="flex-1 p-4">
                    <div className="flex justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                        <div className="h-4 bg-gray-700 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="h-4 bg-gray-700 rounded w-full"></div>
                      <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container mx-auto px-4 py-12 bg-transparent">
        <div className="text-center text-red-500">
          Error loading reviews: {error}
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-16 md:py-20 relative overflow-hidden border-t border-[var(--border-subtle)]">
        {/* Subtle background effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-elevated-1)]/30 to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          {/* Section Header - matching Coming Soon style */}
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

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <RecentReviewCard
                key={review.id}
                review={review}
                onViewReview={setSelectedReview}
              />
            ))}
          </div>
        </div>
      </section>

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

