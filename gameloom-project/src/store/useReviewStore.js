import { create } from "zustand";
import { 
  createReview, 
  getGameReviews, 
  toggleReviewLike, 
  addReviewComment, 
  getReviewComments,
  updateReview as updateReviewApi,
  deleteReview as deleteReviewApi,
  deleteComment as deleteCommentApi,
  updateComment as updateCommentApi
} from "../api";

const useReviewStore = create((set, get) => ({
  reviews: {},  // Keyed by game ID
  isLoading: false,
  error: null,

  // Fetch reviews for a game
  fetchGameReviews: async (gameId) => {
    set({ isLoading: true, error: null });
    try {
      const reviews = await getGameReviews(gameId);
      set((state) => ({
        reviews: {
          ...state.reviews,
          [gameId]: reviews
        },
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Add a new review
  addReview: async (gameId, rating, content) => {
    set({ isLoading: true, error: null });
    try {
      const newReview = await createReview(gameId, rating, content);
      set((state) => ({
        reviews: {
          ...state.reviews,
          [gameId]: state.reviews[gameId] 
            ? [newReview, ...state.reviews[gameId]]
            : [newReview]
        },
        isLoading: false
      }));
      return newReview;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Update a review
  updateReview: async (reviewId, gameId, rating, content) => {
    try {
      const updatedReview = await updateReviewApi(reviewId, rating, content);
      set((state) => ({
        reviews: {
          ...state.reviews,
          [gameId]: state.reviews[gameId].map(review =>
            review.id === reviewId
              ? { 
                  ...review, 
                  rating, 
                  content,
                  updated_at: new Date().toISOString()
                }
              : review
          )
        }
      }));
      return updatedReview;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Delete a review
  deleteReview: async (reviewId, gameId) => {
    try {
      await deleteReviewApi(reviewId);
      set((state) => ({
        reviews: {
          ...state.reviews,
          [gameId]: state.reviews[gameId].filter(review => review.id !== reviewId)
        }
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Toggle like on a review
  toggleLike: async (reviewId, gameId) => {
    try {
      await toggleReviewLike(reviewId);
      set((state) => ({
        reviews: {
          ...state.reviews,
          [gameId]: state.reviews[gameId].map(review =>
            review.id === reviewId
              ? { ...review, likes_count: review.likes_count + (review.user_liked ? -1 : 1), user_liked: !review.user_liked }
              : review
          )
        }
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Fetch comments for a review
  fetchReviewComments: async (reviewId, gameId) => {
    try {
      const comments = await getReviewComments(reviewId);
      set((state) => ({
        reviews: {
          ...state.reviews,
          [gameId]: state.reviews[gameId].map(review =>
            review.id === reviewId
              ? { ...review, comments: comments }
              : review
          )
        }
      }));
      return comments;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Add a comment to a review
  addComment: async (reviewId, gameId, content) => {
    try {
      const newComment = await addReviewComment(reviewId, content);
      set((state) => ({
        reviews: {
          ...state.reviews,
          [gameId]: state.reviews[gameId].map(review =>
            review.id === reviewId
              ? { 
                  ...review, 
                  comments: review.comments ? [...review.comments, newComment] : [newComment],
                  comments_count: review.comments_count + 1 
                }
              : review
          )
        }
      }));
      return newComment;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Delete a comment
  deleteComment: async (reviewId, commentId, gameId) => {
    try {
      await deleteCommentApi(reviewId, commentId);
      set((state) => ({
        reviews: {
          ...state.reviews,
          [gameId]: state.reviews[gameId].map(review =>
            review.id === reviewId
              ? { 
                  ...review, 
                  comments: review.comments.filter(comment => comment.id !== commentId),
                  comments_count: review.comments_count - 1 
                }
              : review
          )
        }
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Update a comment
  updateComment: async (reviewId, commentId, content, gameId) => {
    try {
      const updatedComment = await updateCommentApi(reviewId, commentId, content);
      set((state) => ({
        reviews: {
          ...state.reviews,
          [gameId]: state.reviews[gameId].map(review =>
            review.id === reviewId
              ? { 
                  ...review, 
                  comments: review.comments.map(comment =>
                    comment.id === commentId
                      ? {
                          ...comment,
                          content,
                          updated_at: new Date().toISOString()
                        }
                      : comment
                  )
                }
              : review
          )
        }
      }));
      return updatedComment;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Clear reviews for a game
  clearGameReviews: (gameId) => {
    set((state) => ({
      reviews: {
        ...state.reviews,
        [gameId]: []
      }
    }));
  },

  // Clear all reviews
  clearAllReviews: () => {
    set({ reviews: {} });
  }
}));

export default useReviewStore; 