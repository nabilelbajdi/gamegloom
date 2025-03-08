import React from "react";
import { Plus, Check, Trash2, Loader2 } from "lucide-react";
import useUserGameStore from "../../store/useUserGameStore";

const GameCardStatus = ({ game, onStatusChange, showDropdown, size = "default" }) => {
  const { addGame, removeGame, getGameStatus, updateStatus, isGameLoading } = useUserGameStore();
  const gameStatus = getGameStatus(game.id);
  const isLoading = isGameLoading(game.id);

  const getRibbonDimensions = () => {
    if (size === "large") {
      return {
        width: "42px",
        height: "63px",
        viewBox: "0 0 36 54",
        points: "36 0 0 0 0 50 18 42 36 50",
        shadowPoints: "36 50 36 54 18 46 0 54 0 50 18 42",
        iconSize: "h-7 w-7",
        dropdownTop: "top-[50px]",
        textSize: "text-2xl",
        paddingBottom: "8px"
      };
    }
    
    return {
      width: "30px",
      height: "46px",
      viewBox: "0 0 30 46",
      points: "30 0 0 0 0 44 15 37 30 44",
      shadowPoints: "30 44 30 46 15 39 0 46 0 44 15 37",
      iconSize: "h-5 w-5",
      dropdownTop: "top-[44px]",
      textSize: "text-lg",
      paddingBottom: "6px"
    };
  };

  const dimensions = getRibbonDimensions();

  const handleStatusClick = async (e, status = null) => {
    if (e) {
      e.preventDefault(); 
      e.stopPropagation();
    }

    // Toggle dropdown if no status is provided
    if (status === null) {
      onStatusChange(!showDropdown);
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
      
      onStatusChange(false);
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
    <>
      <div 
        className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
        onClick={(e) => handleStatusClick(e)}
        aria-label={gameStatus ? `Status: ${gameStatus.replace('_', ' ')}` : "Add to collection"}
        role="button"
        tabIndex="0"
      >
        <svg width={dimensions.width} height={dimensions.height} viewBox={dimensions.viewBox} xmlns="http://www.w3.org/2000/svg" role="presentation">
          {/* Ribbon Background */}
          <polygon 
            className={`${getRibbonColor()} transition-colors duration-300`} 
            points={dimensions.points}
          />
          {/* Hover Effect */}
          <polygon 
            className={`${!gameStatus ? `${getHoverColor()} opacity-0 group-hover:opacity-100 backdrop-blur-sm` : getHoverColor()} transition-all duration-300`} 
            points={dimensions.points}
          />
          {/* Shadow */}
          <polygon 
            className="fill-black/40" 
            points={dimensions.shadowPoints}
          />
        </svg>
        
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-white" style={{ paddingBottom: dimensions.paddingBottom }}>
          {isLoading ? (
            <Loader2 className={dimensions.iconSize + " animate-spin"} />
          ) : (() => {
            if (!gameStatus) return <Plus className={dimensions.iconSize} />;
            
            switch(gameStatus) {
              case 'want_to_play': return <Check className={dimensions.iconSize + " stroke-white"} />;
              case 'playing': return <span className={dimensions.textSize}>▶</span>;
              case 'played': return <span className={dimensions.textSize}>🏆</span>;
              default: return <Plus className={dimensions.iconSize} />;
            }
          })()}
        </div>
      </div>
      
      {/* Status Dropdown */}
      {showDropdown && !isLoading && (
        <div 
          className={`absolute ${dimensions.dropdownTop} left-0 z-20 w-32 bg-surface-dark rounded-b-lg shadow-lg border border-gray-800/50 overflow-hidden`}
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
    </>
  );
};

export default GameCardStatus; 