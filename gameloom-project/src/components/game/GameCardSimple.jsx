import React from "react";
import { Star, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { formatGenres } from "../../utils/gameCardUtils";
import GameCardStatus from "./GameCardStatus";
import useStatusDropdown from "../../hooks/useStatusDropdown";

const GameCardSimple = ({ game }) => {
  const { user } = useAuth();
  const { 
    showStatusDropdown,
    coverImageRef, 
    handleCoverMouseLeave, 
    handleStatusChange 
  } = useStatusDropdown();

  return (
    <Link 
      to={`/game/${game.slug || game.igdb_id}`}
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
          <div className="absolute top-0 left-0 z-10 transition-opacity duration-300">
            <GameCardStatus 
              game={game} 
              onStatusChange={handleStatusChange}
              showDropdown={showStatusDropdown}
              size="large"
            />
          </div>
        )}
        
        {/* Hover overlay with "View Game" and game info */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* View Game Button */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <span className="text-xs font-semibold text-white">View Game</span>
              <ExternalLink className="h-3 w-3 text-white stroke-3" />
            </div>
          </div>
          
          {/* Game Info */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-sm font-semibold text-light truncate">
              {game.name}
            </h3>
            <p className="text-xs text-light/80 truncate">
              {formatGenres(game.genres, 2)}
            </p>
          </div>
        </div>
        
        {/* Rating Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-md">
          <Star className="h-5 w-5 text-primary fill-primary" />
          <span className="text-base font-medium text-light">
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