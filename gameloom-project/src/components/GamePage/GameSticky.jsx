// src/components/GamePage/GameSticky.jsx
import React, { useState, useEffect, useRef } from "react";
import { Edit, Trash2, List } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useUserGameStore from "../../store/useUserGameStore";
import useReviewStore from "../../store/useReviewStore";
import useUserListStore from "../../store/useUserListStore";
import GameCover from "../game/GameCover";
import ListSelectionModal from "../game/ListSelectionModal";

const GameSticky = ({ game }) => {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasUserReview, setHasUserReview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [content, setContent] = useState("");
  const [showListsModal, setShowListsModal] = useState(false);
  
  const { user } = useAuth();
  const { getGameStatus } = useUserGameStore();
  const { addReview, fetchUserReviewForGame, userReviews, updateReview, deleteReview } = useReviewStore();
  const { lists, fetchLists } = useUserListStore();
  
  const gameStatus = getGameStatus(game.id);
  
  useEffect(() => {
    if (user) {
      fetchLists();
      const fetchUserReview = async () => {
        const userReview = await fetchUserReviewForGame(game.igdb_id);
        if (userReview) {
          setUserRating(userReview.rating);
          setHasUserReview(true);
        }
      };
      
      fetchUserReview();
    }
  }, [user, game.igdb_id, fetchLists]);

  useEffect(() => {
    const currentReview = userReviews[game.igdb_id];
    if (currentReview) {
      setUserRating(currentReview.rating);
      setHasUserReview(true);
    } else {
      setUserRating(0);
      setHasUserReview(false);
    }
  }, [userReviews, game.igdb_id]);

  const handleStarClick = async (rating) => {
    if (!user) {
      return;
    }
    
    if (hasUserReview) {
      const userReview = userReviews[game.igdb_id];
      
      if (userReview && rating === userRating) {
        setShowDeleteConfirm(true);
        return;
      }
      
      try {
        setError(null);
        setIsSubmitting(true);
        
        await updateReview(userReview.id, game.igdb_id, rating, userReview.content || "");
        setUserRating(rating);
        
      } catch (error) {
        setError(error.message);
        console.error("Error updating rating:", error);
      } finally {
        setIsSubmitting(false);
      }
      
      return;
    }
    
    if (rating === userRating) {
      setUserRating(0);
      return;
    }
    
    try {
      setError(null);
      setIsSubmitting(true);
      
      await addReview(game.igdb_id, rating, "");
      setUserRating(rating);
      setHasUserReview(true);
      
    } catch (error) {
      setError(error.message);
      console.error("Error submitting rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarMouseEnter = (rating) => {
    setHoverRating(rating);
  };

  const handleStarMouseLeave = () => {
    setHoverRating(0);
  };

  const handleDeleteReview = async () => {
    try {
      setError(null);
      setIsSubmitting(true);
      
      const userReview = userReviews[game.igdb_id];
      if (userReview) {
        await deleteReview(userReview.id);
        setUserRating(0);
        setHasUserReview(false);
      }
      
      setShowDeleteConfirm(false);
    } catch (error) {
      setError(error.message);
      console.error("Error deleting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userRating) return;

    try {
      setError(null);
      setIsSubmitting(true);
      
      const userReview = userReviews[game.igdb_id];
      
      if (hasUserReview && userReview) {
        await updateReview(userReview.id, game.igdb_id, userRating, content);
      } else {
        await addReview(game.igdb_id, userRating, content);
        setHasUserReview(true);
      }
      
      setShowReviewModal(false);
    } catch (error) {
      setError(error.message);
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isInAnyList = lists.some(list => 
    list.games?.some(g => g.id === game.id)
  );

  const ratingLabels = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Great",
    5: "Excellent"
  };

  return (
    <div className="sticky top-12 self-start w-[280px] sm:w-[260px] md:w-[300px] lg:w-[320px] sm:py-2 mt-12 sm:mt-0 flex flex-col items-center">
      {/* Game Cover */}
      <div className="w-full">
        <GameCover game={game} />
      </div>

      {/* Rating Section */}
      <div className="mt-3 pt-3 w-full border-t border-gray-800/30">
        {/* Title with conditional text based on user state */}
        <div className="flex items-center justify-between mb-2">
          {user ? (
            <div className="flex items-center gap-2">
              {hasUserReview ? (
                <span className="text-sm uppercase text-white font-bold">
                  YOUR RATING
                </span>
              ) : (
                <span className="text-sm uppercase text-gray-200 font-bold">
                  RATE THIS GAME
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm uppercase text-gray-400 font-bold">
              SIGN IN TO RATE
            </span>
          )}
          
          {/* Write/Edit Review Button */}
          {user && hasUserReview && userRating > 0 && (
            <button
              onClick={() => {
                const userReview = userReviews[game.igdb_id];
                setContent(userReview?.content || "");
                setShowReviewModal(true);
              }}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Edit className="w-3 h-3" />
              {userReviews[game.igdb_id]?.content ? "Edit your review" : "Share your thoughts"}
            </button>
          )}
        </div>
        
        {/* Rating Stars */}
        <div className="flex items-center justify-between bg-surface-dark p-2 rounded-lg shadow-sm">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarMouseEnter(star)}
                onMouseLeave={handleStarMouseLeave}
                className={`
                  text-2xl transition-all duration-200 cursor-pointer
                  ${!user && "cursor-not-allowed opacity-50"}
                  ${isSubmitting && "cursor-wait opacity-70"}
                  ${star <= (hoverRating || userRating) 
                    ? "text-primary hover:text-primary/90 scale-110 drop-shadow-glow" 
                    : "text-gray-600 hover:text-gray-400"
                  }
                `}
                disabled={isSubmitting}
                title={ratingLabels[star]}
              >
                ★
              </button>
            ))}
          </div>
          
          <div className="text-xs font-bold mr-2">
            {(userRating > 0 || hoverRating > 0) ? (
              <span className="text-white">{ratingLabels[hoverRating || userRating]}</span>
            ) : (
              <span className="text-gray-400">Click to rate</span>
            )}
          </div>
        </div>
      </div>

      {/* Lists Section */}
      <div className="mt-2 pt-2 w-full border-t border-gray-800/30">
        <button
          onClick={() => user ? setShowListsModal(true) : null}
          className={`w-full py-2 px-1 rounded-md text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${user ? 'bg-surface-dark text-primary hover:bg-surface-dark/90 cursor-pointer' : 'bg-gray-800/50 text-gray-400 cursor-not-allowed'}`}
        >
          <List className="w-3.5 h-3.5" />
          {isInAnyList ? 'Manage Lists' : 'Add to List'}
        </button>
      </div>

      {/* List Selection Modal */}
      <ListSelectionModal
        isOpen={showListsModal}
        onClose={() => setShowListsModal(false)}
        game={game}
        lists={lists}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface-dark p-5 rounded-lg max-w-sm w-full">
            <h3 className="text-base font-bold mb-3">Delete Rating</h3>
            <p className="text-sm text-gray-300 mb-4">
              Are you sure you want to delete your rating for this game?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReview}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface-dark p-5 rounded-lg max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Your Review</h3>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="p-1 rounded-full hover:bg-gray-800"
              >
                <Trash2 className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => handleStarMouseEnter(star)}
                        onMouseLeave={handleStarMouseLeave}
                        className={`
                          text-2xl transition-all duration-200 cursor-pointer
                          ${isSubmitting && "cursor-wait opacity-70"}
                          ${star <= (hoverRating || userRating) 
                            ? "text-primary hover:text-primary/90" 
                            : "text-gray-600 hover:text-gray-400"
                          }
                        `}
                        disabled={isSubmitting}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  
                  {(userRating > 0 || hoverRating > 0) && (
                    <div className="ml-2 text-sm font-medium text-primary">
                      {ratingLabels[hoverRating || userRating]}
                    </div>
                  )}
                </div>
                
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share what you think about this game..."
                  className="w-full h-32 p-3 bg-gray-900 text-gray-100 border border-gray-800 rounded-md text-sm"
                />
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-900/30 rounded-md flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </div>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!userRating || isSubmitting}
                  className={`
                    px-4 py-2 bg-primary hover:bg-primary/90 text-black text-sm font-medium rounded-md
                    ${(!userRating || isSubmitting) && "opacity-60 cursor-not-allowed"}
                  `}
                >
                  {isSubmitting ? "Saving..." : "Save Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSticky;
