// src/components/game/GameCard.jsx
import { useState, useRef } from "react";
import { Heart, Play, Check, Plus, Bookmark, Trophy, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useUserGameStore from "../../store/useUserGameStore";

const GameCard = ({ game }) => {
  const { user } = useAuth();
  const { addGame, removeGame, getGameStatus, updateStatus } = useUserGameStore();
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const coverImageRef = useRef(null);
  const gameStatus = getGameStatus(game.id);
  
  const handleCoverMouseLeave = () => {
    if (showStatusDropdown) {
      setShowStatusDropdown(false);
    }
  };
  
  const handleStatusClick = async (e, status = null) => {
    if (e) {
      e.preventDefault(); 
      e.stopPropagation();
    }

    if (!user) return;
    
    if (status === null) {
      setShowStatusDropdown(!showStatusDropdown);
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
      
      setShowStatusDropdown(false);
    } catch (error) {
      console.error("Failed to update game status:", error);
    }
  };

  const getRibbonColor = () => {
    if (!gameStatus) return 'fill-black/70';
    
    switch(gameStatus) {
      case 'want_to_play': return 'fill-primary';
      case 'playing': return 'fill-secondary';
      case 'played': return 'fill-gray-300';
      default: return 'fill-black/70';
    }
  };
  
  const getHoverColor = () => {
    if (!gameStatus) return 'fill-primary/60';
    
    switch(gameStatus) {
      case 'want_to_play': return 'fill-primary';
      case 'playing': return 'fill-secondary';
      case 'played': return 'fill-gray-300';
      default: return 'fill-primary/60';
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

  return (
    <Link 
      to={`/game/${game.igdb_id}`}
      className="block group relative overflow-hidden rounded-lg bg-surface transition-all duration-300 hover:bg-surface-hover"
    >
      {/* Game Cover */}
      <div 
        className="aspect-[3/4] overflow-hidden rounded-md relative"
        ref={coverImageRef}
        onMouseLeave={handleCoverMouseLeave}
      >
        <img
          src={game.coverImage} 
          alt={game.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.01] group-hover:opacity-90"
        />
        
        {/* Status Ribbon */}
        {user && (
          <div className="absolute top-0 left-0 z-10">
            <div 
              className="cursor-pointer"
              onClick={(e) => handleStatusClick(e)}
              aria-label={gameStatus ? `Status: ${gameStatus.replace('_', ' ')}` : "Add to collection"}
              role="button"
              tabIndex="0"
            >
              <svg width="30px" height="46px" viewBox="0 0 30 46" xmlns="http://www.w3.org/2000/svg" role="presentation">
                {/* Ribbon Background */}
                <polygon 
                  className={`${getRibbonColor()} transition-colors duration-300`} 
                  points="30 0 0 0 0 44 15 37 30 44"
                />
                {/* Hover Effect */}
                <polygon 
                  className={`${!gameStatus ? `${getHoverColor()} opacity-0 group-hover:opacity-100` : getHoverColor()} transition-all duration-300`} 
                  points="30 0 0 0 0 44 15 37 30 44"
                />
                {/* Shadow */}
                <polygon 
                  className="fill-black/40" 
                  points="30 44 30 46 15 39 0 46 0 44 15 37"
                />
              </svg>
              
              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center text-white" style={{ paddingBottom: "6px" }}>
                {(() => {
                  if (!gameStatus) return <Plus className="h-5 w-5" />;
                  
                  switch(gameStatus) {
                    case 'want_to_play': return <Check className="h-5 w-5 stroke-white" />;
                    case 'playing': return <span className="text-lg">▶</span>;
                    case 'played': return <span className="text-lg">🏆</span>;
                    default: return <Plus className="h-5 w-5" />;
                  }
                })()}
              </div>
            </div>
            
            {/* Status Dropdown */}
            {showStatusDropdown && (
              <div 
                className="absolute top-[44px] left-0 z-20 w-32 bg-surface-dark rounded-b-lg shadow-lg border border-gray-800/50 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {["want_to_play", "playing", "played"].map((status) => (
                  <button
                    key={status}
                    onClick={(e) => handleStatusClick(e, status)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 text-xs text-left
                      transition-colors duration-200 cursor-pointer
                      ${gameStatus === status 
                        ? "bg-gray-800/50 font-semibold" 
                        : "hover:bg-gray-800/50"
                      }
                      ${status === 'want_to_play' ? 'text-primary' : 
                        status === 'playing' ? 'text-secondary' : 
                        status === 'played' ? 'text-white' : 'text-white'}
                    `}
                  >
                    {getStatusIcon(status)}
                    <span className="capitalize">{status.replace(/_/g, " ")}</span>
                  </button>
                ))}
                
                {gameStatus && (
                  <button
                    onClick={(e) => handleStatusClick(e, gameStatus)}
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
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Game Info */}
      <div className="p-3 bg-surface-dark transition-colors duration-300 group-hover:bg-surface-dark/90">
        <h3 className="text-sm font-semibold text-heading truncate">
          {game.name}
        </h3>
        <p className="text-xs text-muted truncate">
          {game.genres || "Unknown Genre"}
        </p>

        {/* Rating & Actions */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-primary text-xs">★</span>
            <span className="text-xs text-muted">
              {game.rating !== "N/A" ? game.rating : "N/A"}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
            <button className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-primary transition-colors cursor-pointer">
              <Heart className="h-3 w-3" />
            </button>
            <button className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-secondary transition-colors cursor-pointer">
              <Play className="h-3 w-3" />
            </button>
            <button className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-white transition-colors cursor-pointer">
              <Check className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;
