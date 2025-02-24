import React, { useState } from 'react';
import useReviewStore from '../../store/useReviewStore';

const AddReview = ({ gameId }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { addReview } = useReviewStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return;

    try {
      setError(null);
      setIsSubmitting(true);
      await addReview(gameId, rating, content);
      setRating(0);
      setContent('');
    } catch (error) {
      setError(error.message);
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface p-4 rounded-lg space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Rating Stars */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Your Rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star === rating ? 0 : star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-2xl focus:outline-none transition-colors cursor-pointer"
            >
              <span
                className={`${
                  star <= (hoverRating || rating)
                    ? 'text-primary'
                    : 'text-gray-600'
                }`}
              >
                ★
              </span>
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-400">
              {rating} star{rating !== 1 && 's'}
            </span>
          )}
        </div>
      </div>

      {/* Review Content */}
      <div className="space-y-2">
        <label htmlFor="review-content" className="block text-sm font-medium">
          Your Review
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What did you think about this game? (optional)"
          rows={4}
          className="w-full px-3 py-2 text-sm bg-surface-hover rounded-lg border border-surface-border focus:outline-none focus:border-primary resize-none"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!rating || isSubmitting}
          className="px-4 py-2 text-sm bg-primary text-dark rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-dark/20 border-t-dark rounded-full animate-spin"></div>
              Submitting...
            </div>
          ) : (
            'Submit Review'
          )}
        </button>
      </div>
    </form>
  );
};

export default AddReview; 