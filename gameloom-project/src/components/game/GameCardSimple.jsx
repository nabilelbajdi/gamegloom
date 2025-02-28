import { useState, useRef } from "react";
import { Plus, Check, Star, Eye, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useUserGameStore from "../../store/useUserGameStore";

const GameCardSimple = ({ game }) => {
  const { user } = useAuth();
  const { getGameStatus, addGame, updateStatus, removeGame } = useUserGameStore();
  const coverImageRef = useRef(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const gameStatus = game?.id ? getGameStatus(game.id) : null;
  
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

    if (!user || !game?.id) return;
    
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
      className="block group relative overflow-hidden rounded-lg transition-all duration-300"
    >
      {/* Game Cover */}
      <div 
        className="aspect-[3/4] overflow-hidden rounded-lg relative"
        ref={coverImageRef}
        onMouseLeave={handleCoverMouseLeave}
      >
        <img
          src={game.coverImage || game.cover_image} 
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
            {showStatusDropdown && (
              <div 
                className="absolute top-[50px] left-0 z-20 w-32 bg-dark rounded-b-lg shadow-lg border border-gray-800/50 overflow-hidden"
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
        
        {/* Hover overlay with "View Game" and game info */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* View Game Button */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="px-3 py-1.5 bg-primary/90 rounded-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <Eye className="h-3.5 w-3.5 text-dark" />
              <span className="text-xs font-medium text-dark">View Game</span>
            </div>
          </div>
          
          {/* Game Info */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-sm font-semibold text-light truncate">
              {game.name}
            </h3>
            <p className="text-xs text-light/80 truncate">
              {game.genres ? 
                (() => {
                  let genreArray = Array.isArray(game.genres) 
                    ? game.genres 
                    : game.genres.split(',');
                  
                  genreArray = genreArray.map(genre => {
                    const trimmed = genre.trim();
                    return trimmed === "Role-playing (RPG)" ? "RPG" : trimmed;
                  });
                  
                  return genreArray.slice(0, 2).join(', ');
                })() 
                : "Unknown Genre"
              }
            </p>
          </div>
        </div>
        
        {/* Rating Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md">
          <Star className="h-4 w-4 text-primary fill-primary" />
          <span className="text-sm font-medium text-light">
            {game.rating !== undefined && game.rating !== null && game.rating !== "N/A" 
              ? Math.round(game.rating * 10) / 10 
              : "N/A"}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default GameCardSimple; 