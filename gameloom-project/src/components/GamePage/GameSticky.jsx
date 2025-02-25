// src/components/GamePage/GameSticky.jsx
import React, { useState, useEffect, useRef } from "react";
import { PlusCircle, Check, ChevronDown, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useUserGameStore from "../../store/useUserGameStore";
import { Link } from "react-router-dom";

const GameSticky = ({ game }) => {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  const dropdownRef = useRef(null);
  const { user } = useAuth();
  const { addGame, updateStatus, removeGame, getGameStatus } = useUserGameStore();
  const gameStatus = getGameStatus(game.id);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStatusMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStarClick = (rating) => {
    setUserRating(rating === userRating ? 0 : rating);
  };

  const handleStarMouseEnter = (rating) => {
    setHoverRating(rating);
  };

  const handleStarMouseLeave = () => {
    setHoverRating(0);
  };

  const handleStatusClick = async (status) => {
    try {
      if (gameStatus === status) {
        await removeGame(game.id);
      } else if (gameStatus) {
        await updateStatus(game.id, status);
      } else {
        await addGame(game.id, status);
      }
      setShowStatusMenu(false);
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

  return (
    <div className="sticky top-20 self-start w-64 sm:w-52 md:w-64 sm:py-6 mt-24 sm:mt-0 flex flex-col items-center">
      <img
        src={game.coverImage}
        alt={game.name}
        className="w-full rounded-lg shadow-md object-cover"
      />

      <div className="mt-4 w-full flex flex-col space-y-2">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`
                w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg
                text-sm font-medium transition-all duration-200
                bg-[#1a1b1e] text-gray-100 hover:bg-gray-800/50
                border border-gray-800/50 cursor-pointer
              `}
            >
              {gameStatus ? <Check className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
              {getStatusLabel()}
              <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${showStatusMenu ? "rotate-180" : ""}`} />
            </button>

            {showStatusMenu && (
              <div 
                className="
                  absolute top-full left-0 w-full mt-1
                  bg-[#1a1b1e] rounded-lg shadow-lg
                  border border-gray-800/50
                  overflow-hidden
                "
              >
                {["want_to_play", "playing", "played"].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusClick(status)}
                    className={`
                      w-full flex items-center justify-between
                      px-3 py-1.5 text-sm font-medium
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
                    onClick={() => handleStatusClick(gameStatus)}
                    className="
                      w-full flex items-center gap-2 px-3 py-1.5
                      text-sm font-medium text-red-600
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

      {/* Rate Game Section */}
      <div className="mt-4 w-full flex flex-col items-center">
        <div className="flex items-center mt-1 text-primary text-3xl gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`w-6 h-6 cursor-pointer transition-colors duration-200 ${
                star <= (hoverRating || userRating) ? "text-primary" : "text-gray-400"
              }`}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarMouseEnter(star)}
              onMouseLeave={handleStarMouseLeave}
            >
              ★
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameSticky;
