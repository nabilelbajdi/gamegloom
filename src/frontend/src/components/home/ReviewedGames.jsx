// src/components/home/ReviewedGames.jsx
import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { getRecentReviews } from "../../api";
import RecentReviewCard from "./RecentReviewCard";
import SectionHeader from "../common/SectionHeader";

const ReviewedGames = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <section className="container mx-auto px-4 py-12 bg-transparent">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-light">Recently Reviewed</h2>
        </div>
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
                  <div className="mt-4 pt-3 border-t border-gray-700/50 flex gap-4">
                    <div className="h-4 bg-gray-700 rounded w-12"></div>
                    <div className="h-4 bg-gray-700 rounded w-12"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
    <section className="container mx-auto px-4 py-12 bg-transparent">
      {/* Section Title with Gradient Underline */}
      <div className="mb-2">
        <SectionHeader 
          title="Recently Reviewed" 
          viewAllLink="/reviews" 
          showGradient={true}
        />
        <p className="text-gray-400 mt-3 ml-1">Latest game reviews from our community</p>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {reviews.map((review) => (
          <RecentReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
};

export default ReviewedGames;
