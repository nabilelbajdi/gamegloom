// src/components/game/GameCard.jsx
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { formatGenres, formatRating } from "../../utils/gameCardUtils";
import GameCardStatus from "./GameCardStatus";
import useStatusDropdown from "../../hooks/useStatusDropdown";

const GameCard = ({ game }) => {
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
        <div className="absolute top-0 left-0 z-10">
          <GameCardStatus 
            game={game} 
            onStatusChange={handleStatusChange}
            showDropdown={showStatusDropdown} 
          />
        </div>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Game Info */}
      <div className="p-3 bg-surface-dark transition-colors duration-300 group-hover:bg-surface-dark/90">
        <h3 className="text-sm font-semibold text-heading truncate">
          {game.name}
        </h3>
        <p className="text-xs text-muted truncate">
          {formatGenres(game.genres, 3)}
        </p>

        {/* Rating & Actions */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-primary fill-primary" />
            <span className="text-xs text-muted">
              {game.rating === "N/A" 
                ? "N/A"
                : typeof game.rating === 'number' || !isNaN(parseFloat(game.rating))
                  ? parseFloat(game.rating).toFixed(1)
                  : "N/A"
              }
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;
