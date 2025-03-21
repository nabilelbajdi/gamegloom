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
  updateComment as updateCommentApi,
  getUserReviewForGame
} from "../api";

const useReviewStore = create((set, get) => ({
  reviews: {}, 
  userReviews: {}, 
  isLoading: false,
  error: null,

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

  fetchUserReviewForGame: async (gameId) => {
    try {
      const review = await getUserReviewForGame(gameId);
      
      set((state) => ({
        userReviews: {
          ...state.userReviews,
          [gameId]: review
        }
      }));
      
      return review;
    } catch (error) {
      console.error("Error fetching user review:", error);
      return null;
    }
  },

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
        userReviews: {
          ...state.userReviews,
          [gameId]: newReview
        },
        isLoading: false
      }));
      return newReview;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

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
                  ...updatedReview
                }
              : review
          )
        },
        userReviews: {
          ...state.userReviews,
          [gameId]: updatedReview
        }
      }));
      return updatedReview;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteReview: async (reviewId, gameId) => {
    try {
      await deleteReviewApi(reviewId);
      
      const userReviews = get().userReviews;
      let targetGameId = gameId;
      
      if (!targetGameId) {
        Object.entries(userReviews).forEach(([id, review]) => {
          if (review && review.id === reviewId) {
            targetGameId = parseInt(id);
          }
        });
      }
      
      set((state) => ({
        reviews: {
          ...state.reviews,
          [targetGameId]: state.reviews[targetGameId]?.filter(review => review.id !== reviewId) || []
        },
        userReviews: {
          ...state.userReviews,
          [targetGameId]: null
        }
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  toggleLike: async (reviewId, gameId) => {
    try {
      await toggleReviewLike(reviewId);
      set((state) => {
        const reviewIndex = state.reviews[gameId]?.findIndex(r => r.id === reviewId);
        if (reviewIndex === -1 || !state.reviews[gameId]) return state;
        
        const review = state.reviews[gameId][reviewIndex];
        const updatedLikesCount = review.likes_count + (review.user_liked ? -1 : 1);
        const updatedUserLiked = !review.user_liked;
        
        return {
          reviews: {
            ...state.reviews,
            [gameId]: state.reviews[gameId].map(r =>
              r.id === reviewId
                ? { ...r, likes_count: updatedLikesCount, user_liked: updatedUserLiked }
                : r
            )
          },
          userReviews: {
            ...state.userReviews,
            [gameId]: state.userReviews[gameId]?.id === reviewId
              ? { ...state.userReviews[gameId], likes_count: updatedLikesCount, user_liked: updatedUserLiked }
              : state.userReviews[gameId]
          }
        };
      });
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchReviewComments: async (reviewId, gameId) => {
    try {
      const comments = await getReviewComments(reviewId);
      set((state) => {
        const updatedReviews = {
          ...state.reviews,
          [gameId]: state.reviews[gameId]?.map(review =>
            review.id === reviewId
              ? { ...review, comments: comments }
              : review
          ) || []
        };
        
        const updatedUserReviews = { ...state.userReviews };
        if (updatedUserReviews[gameId]?.id === reviewId) {
          updatedUserReviews[gameId] = { 
            ...updatedUserReviews[gameId], 
            comments: comments 
          };
        }
        
        return {
          reviews: updatedReviews,
          userReviews: updatedUserReviews
        };
      });
      return comments;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  addComment: async (reviewId, gameId, content) => {
    try {
      const newComment = await addReviewComment(reviewId, content);
      set((state) => {
        const updatedReviews = {
          ...state.reviews,
          [gameId]: state.reviews[gameId]?.map(review =>
            review.id === reviewId
              ? { 
                  ...review, 
                  comments: review.comments ? [...review.comments, newComment] : [newComment],
                  comments_count: review.comments_count + 1 
                }
              : review
          ) || []
        };
        
        const updatedUserReviews = { ...state.userReviews };
        if (updatedUserReviews[gameId]?.id === reviewId) {
          updatedUserReviews[gameId] = { 
            ...updatedUserReviews[gameId],
            comments: updatedUserReviews[gameId].comments 
              ? [...updatedUserReviews[gameId].comments, newComment] 
              : [newComment],
            comments_count: updatedUserReviews[gameId].comments_count + 1
          };
        }
        
        return {
          reviews: updatedReviews,
          userReviews: updatedUserReviews
        };
      });
      return newComment;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteComment: async (reviewId, commentId, gameId) => {
    try {
      await deleteCommentApi(reviewId, commentId);
      set((state) => {
        const updatedReviews = {
          ...state.reviews,
          [gameId]: state.reviews[gameId]?.map(review =>
            review.id === reviewId
              ? { 
                  ...review, 
                  comments: review.comments?.filter(comment => comment.id !== commentId) || [],
                  comments_count: review.comments_count - 1 
                }
              : review
          ) || []
        };
        
        const updatedUserReviews = { ...state.userReviews };
        if (updatedUserReviews[gameId]?.id === reviewId) {
          updatedUserReviews[gameId] = { 
            ...updatedUserReviews[gameId],
            comments: updatedUserReviews[gameId].comments?.filter(comment => comment.id !== commentId) || [],
            comments_count: updatedUserReviews[gameId].comments_count - 1
          };
        }
        
        return {
          reviews: updatedReviews,
          userReviews: updatedUserReviews
        };
      });
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updateComment: async (reviewId, commentId, content, gameId) => {
    try {
      const updatedComment = await updateCommentApi(reviewId, commentId, content);
      set((state) => {
        const updatedReviews = {
          ...state.reviews,
          [gameId]: state.reviews[gameId]?.map(review =>
            review.id === reviewId
              ? { 
                  ...review, 
                  comments: review.comments?.map(comment =>
                    comment.id === commentId
                      ? {
                          ...comment,
                          content,
                          updated_at: new Date().toISOString()
                        }
                      : comment
                  ) || []
                }
              : review
          ) || []
        };
        
        const updatedUserReviews = { ...state.userReviews };
        if (updatedUserReviews[gameId]?.id === reviewId) {
          updatedUserReviews[gameId] = { 
            ...updatedUserReviews[gameId],
            comments: updatedUserReviews[gameId].comments?.map(comment =>
              comment.id === commentId
                ? {
                    ...comment,
                    content,
                    updated_at: new Date().toISOString()
                  }
                : comment
            ) || []
          };
        }
        
        return {
          reviews: updatedReviews,
          userReviews: updatedUserReviews
        };
      });
      return updatedComment;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  clearGameReviews: (gameId) => {
    set((state) => ({
      reviews: {
        ...state.reviews,
        [gameId]: []
      }
    }));
  },

  clearAllReviews: () => {
    set({ reviews: {} });
  }
}));

export default useReviewStore; 