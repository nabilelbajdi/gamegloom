// src/components/GamePage/GameSticky.jsx
import React, { useState, useEffect, useRef } from "react";
import { PlusCircle, Check, ChevronDown, Trash2, AlertCircle, X, Edit, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useUserGameStore from "../../store/useUserGameStore";
import useReviewStore from "../../store/useReviewStore";
import { Link } from "react-router-dom";

const GameSticky = ({ game }) => {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showRibbonDropdown, setShowRibbonDropdown] = useState(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasUserReview, setHasUserReview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const dropdownRef = useRef(null);
  const ribbonDropdownRef = useRef(null);
  const coverImageRef = useRef(null);
  
  const { user } = useAuth();
  const { addGame, updateStatus, removeGame, getGameStatus } = useUserGameStore();
  const { addReview, fetchUserReviewForGame, userReviews, updateReview, deleteReview } = useReviewStore();
  const gameStatus = getGameStatus(game.id);
  
  useEffect(() => {
    if (user) {
      const fetchUserReview = async () => {
        const userReview = await fetchUserReviewForGame(game.igdb_id);
        if (userReview) {
          setUserRating(userReview.rating);
          setHasUserReview(true);
        }
      };
      
      fetchUserReview();
    }
  }, [user, game.igdb_id]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStatusMenu(false);
      }
      
      if (ribbonDropdownRef.current && !ribbonDropdownRef.current.contains(event.target)) {
        setShowRibbonDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCoverMouseLeave = () => {
    if (showRibbonDropdown) {
      setShowRibbonDropdown(false);
    }
  };

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

  const getStatusIcon = (status) => {
    switch(status) {
      case 'want_to_play': return <Check className="h-4 w-4" />;
      case 'playing': return <span className="text-base">▶</span>;
      case 'played': return <span className="text-base">🏆</span>;
      default: return <Plus className="h-4 w-4" />;
    }
  };
  
  const handleRibbonStatusClick = async (e, status = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    
    if (status === null) {
      setShowRibbonDropdown(!showRibbonDropdown);
      return;
    }
    
    try {
      if (status === gameStatus) {
        await removeGame(game.id);
      } else if (gameStatus) {
        await updateStatus(game.id, status);
      } else {
        await addGame(game.id, status);
      }
      
      setShowRibbonDropdown(false);
    } catch (error) {
      console.error("Failed to update game status:", error);
    }
  };

  const getStatusLabel = () => {
    switch (gameStatus) {
      case "want_to_play":
        return "Want to Play";
      case "playing":
        return "Playing";
      case "played":
        return "Played";
      default:
        return "Add to Library";
    }
  };

  const ratingLabels = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Great",
    5: "Excellent"
  };

  const getRibbonColor = () => {
    if (!gameStatus) return 'fill-black/70';
    
    switch(gameStatus) {
      case 'want_to_play': return 'fill-primary';
      case 'playing': return 'fill-secondary';
      case 'played': return 'fill-success';
      default: return 'fill-black/70';
    }
  };
  
  const getHoverColor = () => {
    if (!gameStatus) return 'fill-primary/60';
    
    switch(gameStatus) {
      case 'want_to_play': return 'fill-primary';
      case 'playing': return 'fill-secondary';
      case 'played': return 'fill-success';
      default: return 'fill-primary/60';
    }
  };

  return (
    <div className="sticky top-20 self-start w-64 sm:w-52 md:w-64 sm:py-6 mt-24 sm:mt-0 flex flex-col items-center">
      {/* Game Cover */}
      <div 
        className="relative w-full group overflow-hidden rounded-lg"
        ref={coverImageRef}
        onMouseLeave={handleCoverMouseLeave}
      >
        <img
          src={game.coverImage}
          alt={game.name}
          className="w-full shadow-md object-cover transition-opacity duration-700 group-hover:opacity-90"
        />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Status Ribbon */}
        {user && (
          <div className="absolute top-0 left-0 z-10" ref={ribbonDropdownRef}>
            <div 
              className="cursor-pointer"
              onClick={(e) => handleRibbonStatusClick(e)}
              aria-label={gameStatus ? `Status: ${gameStatus.replace('_', ' ')}` : "Add to collection"}
              role="button"
              tabIndex="0"
            >
              <svg width="36px" height="54px" viewBox="0 0 36 54" xmlns="http://www.w3.org/2000/svg" role="presentation">
                {/* Ribbon Background */}
                <polygon 
                  className={`${getRibbonColor()} transition-colors duration-300`} 
                  points="36 0 0 0 0 50 18 42 36 50"
                />
                {/* Hover Effect */}
                <polygon 
                  className={`${!gameStatus ? `${getHoverColor()} opacity-0 group-hover:opacity-100` : getHoverColor()} transition-all duration-300`} 
                  points="36 0 0 0 0 50 18 42 36 50"
                />
                {/* Shadow */}
                <polygon 
                  className="fill-black/40" 
                  points="36 50 36 54 18 46 0 54 0 50 18 42"
                />
              </svg>
              
              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center text-white" style={{ paddingBottom: "8px" }}>
                {(() => {
                  if (!gameStatus) return <Plus className="h-6 w-6" />;
                  
                  switch(gameStatus) {
                    case 'want_to_play': return <Check className="h-6 w-6 stroke-white" />;
                    case 'playing': return <span className="text-xl">▶</span>;
                    case 'played': return <span className="text-xl">🏆</span>;
                    default: return <Plus className="h-6 w-6" />;
                  }
                })()}
              </div>
            </div>
            
            {/* Status Dropdown */}
            {showRibbonDropdown && (
              <div 
                className="absolute top-[50px] left-0 z-20 w-36 bg-surface-dark rounded-b-lg shadow-lg border border-gray-800/50 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {["want_to_play", "playing", "played"].map((status) => (
                  <button
                    key={status}
                    onClick={(e) => handleRibbonStatusClick(e, status)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 text-xs text-left
                      transition-colors duration-200 cursor-pointer
                      ${gameStatus === status 
                        ? "bg-gray-800/50 font-semibold" 
                        : "hover:bg-gray-800/50"
                      }
                      ${status === 'want_to_play' ? 'text-primary' : 
                        status === 'playing' ? 'text-secondary' : 
                        status === 'played' ? 'text-success' : 'text-white'}
                    `}
                  >
                    {getStatusIcon(status)}
                    <span className="capitalize">{status.replace(/_/g, " ")}</span>
                  </button>
                ))}
                
                {gameStatus && (
                  <button
                    onClick={(e) => handleRibbonStatusClick(e, gameStatus)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-700 hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add to Library Button */}
      <div className="mt-5 w-full">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`
                w-full flex items-center justify-center gap-2 py-2 px-3.5 rounded-lg
                text-sm font-bold transition-all duration-200
                bg-surface-dark text-gray-100 hover:bg-gray-800/50
                border border-gray-800/50 cursor-pointer
              `}
            >
              {gameStatus ? (
                gameStatus === 'want_to_play' ? <Check className="w-3.5 h-3.5" /> :
                gameStatus === 'playing' ? <span className="text-sm">▶</span> :
                gameStatus === 'played' ? <span className="text-sm">🏆</span> :
                <Check className="w-3.5 h-3.5" />
              ) : <PlusCircle className="w-3.5 h-3.5" />}
              {getStatusLabel()}
              <ChevronDown className={`w-3.5 h-3.5 ml-1.5 transition-transform duration-200 ${showStatusMenu ? "rotate-180" : ""}`} />
            </button>

            {showStatusMenu && (
              <div 
                className="
                  absolute top-full left-0 w-full mt-1.5
                  bg-surface-dark rounded-lg shadow-lg
                  border border-gray-800/50
                  overflow-hidden
                  z-20
                "
              >
                {["want_to_play", "playing", "played"].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleRibbonStatusClick(null, status)}
                    className={`
                      w-full flex items-center justify-between
                      px-3.5 py-2 text-sm font-semibold
                      transition-colors duration-200 cursor-pointer
                      ${gameStatus === status 
                        ? "text-primary bg-gray-800/50"
                        : "text-gray-100 hover:bg-gray-800/50"
                      }
                    `}
                  >
                    <span className="capitalize">{status.replace(/_/g, " ")}</span>
                    {gameStatus === status && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
                
                {gameStatus && (
                  <button
                    onClick={() => handleRibbonStatusClick(null, gameStatus)}
                    className="
                      w-full flex items-center gap-2 px-3.5 py-2
                      text-sm font-bold text-red-700
                      transition-colors duration-200 cursor-pointer
                      hover:bg-gray-800/50
                    "
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove from Library
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <Link 
            to="/login" 
            className="
              w-full flex items-center justify-center gap-2 
              py-2.5 px-4 rounded-md
              bg-surface text-light hover:bg-surface-hover
              text-sm font-medium transition-all duration-200
            "
          >
            <PlusCircle className="w-4 h-4" /> Add to Library
          </Link>
        )}
      </div>

      {/* Rating Section */}
      <div className="mt-6 pt-6 w-full border-t border-gray-800/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase text-gray-500 font-bold">
            {user ? (hasUserReview ? "Your Rating" : "Rate Game") : "Sign in to rate"}
          </span>
          
          {user && hasUserReview && userRating > 0 && (
            <button
              onClick={() => {
                const userReview = userReviews[game.igdb_id];
                setContent(userReview?.content || "");
                setShowReviewModal(true);
              }}
              className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit className="w-3 h-3" />
              {userReviews[game.igdb_id]?.content ? "Edit Review" : "Write Review"}
            </button>
          )}
        </div>
        
        {/* Rating Stars */}
        <div className="flex items-center justify-between">
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
                    ? "text-primary hover:text-primary/90 scale-105" 
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
            <div className="text-xs font-bold text-primary">
              {ratingLabels[hoverRating || userRating]}
            </div>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-3.5 p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-dark p-6 rounded-lg border border-gray-800/50 shadow-lg max-w-2xl w-full mx-4 relative">
            <button
              onClick={() => {
                setShowReviewModal(false);
                setContent("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-200 mb-1">
                {userReviews[game.igdb_id]?.content ? "Edit your review" : "Write your review"}
              </h3>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setUserRating(star)}
                    className={`text-2xl cursor-pointer ${
                      star <= userRating ? "text-primary" : "text-gray-400"
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-sm font-medium text-primary ml-2">
                  {ratingLabels[userRating]}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <textarea
                  id="review-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What did you think about this game?"
                  rows={5}
                  className="w-full px-3 py-2 text-sm bg-white text-gray-700 placeholder-gray-500 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
                />
                {content.length > 0 && (
                  <div className="text-xs text-gray-500">
                    {content.length} characters
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewModal(false);
                    setContent("");
                  }}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="px-4 py-2 text-sm bg-primary text-dark font-medium rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-dark/20 border-t-dark rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    "Post Review"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-dark p-6 rounded-lg border border-gray-800/50 shadow-lg max-w-sm w-full mx-4 relative">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-medium text-gray-200 mb-2">Delete Rating</h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to delete your {userRating}-star rating{userReviews[game.igdb_id]?.content ? " and review" : ""}?
            </p>
            
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReview}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSticky;
