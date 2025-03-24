import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { formatGenres } from "../../utils/gameCardUtils";
import GameCardStatus from "./GameCardStatus";
import useStatusDropdown from "../../hooks/useStatusDropdown";

const GridGameCard = ({ game, starRating, smallStatus = false }) => {
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
      className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-surface transition-all duration-300 hover:shadow-xl"
    >
      {/* Game Cover */}
      <div className="h-full" ref={coverImageRef} onMouseLeave={handleCoverMouseLeave}>
        <img 
          src={game.coverImage || game.cover_image} 
          alt={game.name} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.01] group-hover:opacity-90"
        />
        
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Status Ribbon */}
        {user && (
          <div className={`absolute top-0 left-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
            <GameCardStatus 
              game={game}
              onStatusChange={handleStatusChange}
              showDropdown={showStatusDropdown}
              size={smallStatus ? "small" : "default"}
            />
          </div>
        )}

        {/* Game information overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <h3 className="text-sm font-semibold text-white truncate">{game.name}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-300">
              {formatGenres(game.genres, 1)}
            </span>
            {starRating ? (
              starRating
            ) : (
              game.rating !== "N/A" && game.rating !== undefined && game.rating !== null && !isNaN(parseFloat(game.rating)) && (
                <div className="flex items-center">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  <span className="text-xs text-gray-300 ml-1">{parseFloat(game.rating).toFixed(1)}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GridGameCard; 