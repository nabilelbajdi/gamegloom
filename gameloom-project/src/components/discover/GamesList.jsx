import React from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useUserGameStore from "../../store/useUserGameStore";

const GamesList = ({
  games,
  loading
}) => {
  const { user } = useAuth();
  const { getGameStatus } = useUserGameStore();

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="animate-pulse bg-surface-dark rounded-md p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-20 bg-surface rounded"></div>
              <div className="flex-1">
                <div className="h-5 bg-surface rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-surface rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-surface rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // No results state
  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-xl font-semibold text-light mb-2">No games found</h3>
        <p className="text-light/70 max-w-md mb-6">
          We couldn't find any games matching your criteria.
        </p>
      </div>
    );
  }

  // Games list
  return (
    <div className="space-y-3">
      {games.map((game) => {
        const gameStatus = getGameStatus(game.id);
        
        const getStatusColor = () => {
          if (!gameStatus) return "";
          
          switch(gameStatus) {
            case "want_to_play": return "border-l-primary";
            case "playing": return "border-l-secondary";
            case "played": return "border-l-gray-300";
            default: return "";
          }
        };
        
        return (
          <Link
            key={game.id}
            to={`/game/${game.igdb_id}`}
            className={`flex items-start gap-4 p-4 bg-surface-dark hover:bg-surface-hover/80 transition-colors rounded-md ${user && gameStatus ? `border-l-4 ${getStatusColor()}` : ""}`}
          >
            {/* Game Cover */}
            <div className="w-16 md:w-20 shrink-0">
              <div className="aspect-[3/4] rounded-md overflow-hidden">
                <img
                  src={game.coverImage} 
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Game Details */}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-heading">{game.name}</h3>
                  <div className="text-sm text-muted mt-1">
                    {game.releaseDate ? new Date(game.releaseDate).getFullYear() : "TBA"} 
                    {game.platforms && (
                      <span className="ml-2 text-xs">
                        {typeof game.platforms === "string" 
                          ? game.platforms.split(",").slice(0, 3).join(", ")
                          : Array.isArray(game.platforms) 
                            ? game.platforms.slice(0, 3).join(", ")
                            : ""
                        }
                        {(typeof game.platforms === "string" 
                          ? game.platforms.split(",").length > 3
                          : Array.isArray(game.platforms) && game.platforms.length > 3) 
                          && "..."
                        }
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {game.rating !== "N/A" && (
                    <div className="flex items-center gap-1 bg-surface px-2 py-1 rounded">
                      <Star className="w-3 h-3 text-primary fill-primary" />
                      <span className="text-xs font-medium">{game.rating}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Genres */}
              <div className="mt-2 flex flex-wrap gap-1">
                {game.genres && (
                  <>
                    {(typeof game.genres === "string" 
                      ? game.genres.split(",")
                      : Array.isArray(game.genres) 
                        ? game.genres
                        : []
                    ).slice(0, 5).map((genre, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-0.5 bg-surface text-xs text-muted rounded-full"
                      >
                        {genre.trim()}
                      </span>
                    ))}
                  </>
                )}
              </div>
              
              {/* Description */}
              {game.summary && (
                <p className="text-sm text-muted mt-2 line-clamp-2">
                  {game.summary}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default GamesList; 