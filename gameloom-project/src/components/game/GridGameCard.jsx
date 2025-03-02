import { useState, useRef } from "react";
import { Plus, Check, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useUserGameStore from "../../store/useUserGameStore";

const GridGameCard = ({ game }) => {
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
    if (!gameStatus) return 'fill-white/20';
    
    switch(gameStatus) {
      case 'want_to_play': return 'fill-primary/30';
      case 'playing': return 'fill-secondary/30';
      case 'played': return 'fill-gray-300/30';
      default: return 'fill-white/20';
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
      className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-surface transition-all duration-300 hover:shadow-xl"
    >
      {/* Game Cover */}
      <div className="h-full">
        <img 
          src={game.coverImage || game.cover_image} 
          alt={game.name} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.01] group-hover:opacity-90"
        />
        
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Status Ribbon */}
        {user && (
          <div className="absolute top-0 left-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
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
                  className={`${!gameStatus ? `${getHoverColor()} opacity-0 group-hover:opacity-100 backdrop-blur-sm` : getHoverColor()} transition-all duration-300`} 
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

        {/* Game information overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <h3 className="text-sm font-semibold text-white truncate">{game.name}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-300">
              {game.genres ? 
                (() => {
                  let genreArray = Array.isArray(game.genres) 
                    ? game.genres 
                    : game.genres.split(',');
                  
                  return genreArray[0];
                })() 
                : "Unknown"
              }
            </span>
            {game.rating !== "N/A" && (
              <div className="flex items-center">
                <span className="text-primary">★</span>
                <span className="text-xs text-gray-300 ml-1">{game.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GridGameCard; 