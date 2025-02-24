import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import useReviewStore from '../../store/useReviewStore';
import AddReview from './AddReview';
import ReviewItem from './ReviewItem';

const ReviewList = ({ gameId }) => {
  const { user } = useAuth();
  const { reviews, isLoading, error, fetchGameReviews } = useReviewStore();
  const gameReviews = reviews[gameId] || [];

  useEffect(() => {
    fetchGameReviews(gameId);
  }, [gameId]);

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        <div className="h-32 bg-surface animate-pulse rounded-lg"></div>
        <div className="h-32 bg-surface animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Reviews Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Reviews {gameReviews.length > 0 && `(${gameReviews.length})`}
        </h2>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 text-red-500 rounded-lg">
          {error}
        </div>
      )}

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
        {gameReviews.length > 0 ? (
          gameReviews.map(review => (
            <ReviewItem 
              key={review.id} 
              review={review}
              gameId={gameId}
            />
          ))
        ) : (
          <div className="p-4 bg-surface rounded-lg text-center">
            <p className="text-gray-400">No reviews yet. Be the first to review!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewList; 