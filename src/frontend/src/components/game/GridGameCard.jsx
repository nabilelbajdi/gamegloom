import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { formatGenres } from "../../utils/gameCardUtils";
import GameCardStatus from "./GameCardStatus";
import useStatusDropdown from "../../hooks/useStatusDropdown";

const GridGameCard = ({ game, starRating, smallStatus = false, compact = false, hideRibbon = false }) => {
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
      className="block group relative aspect-[3/4] rounded-lg overflow-hidden bg-[var(--bg-elevated-2)] transition-all duration-300 hover:shadow-xl"
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

        {/* Status Ribbon - Always visible in exploration, hover-only in library */}
        <div className={`absolute top-0 left-0 z-10 ${hideRibbon ? 'opacity-0 group-hover:opacity-100 transition-opacity duration-300' : ''}`}>
          <GameCardStatus
            game={game}
            onStatusChange={handleStatusChange}
            showDropdown={showStatusDropdown}
            size={smallStatus ? "small" : "default"}
          />
        </div>

        {/* Rating badge - top right */}
        {!starRating && game.rating !== "N/A" && game.rating !== undefined && game.rating !== null && !isNaN(parseFloat(game.rating)) && (
          <div className={`absolute ${compact ? 'top-1 right-1' : 'top-2 right-2'} flex items-center gap-0.5 ${compact ? 'px-1 py-0.5' : 'px-1.5 py-1'} bg-black/60 rounded backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
            <Star className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-primary fill-primary`} />
            <span className={`${compact ? 'text-[9px]' : 'text-[11px]'} font-semibold text-gray-300 -translate-y-px`}>{parseFloat(game.rating).toFixed(1)}</span>
          </div>
        )}

        {/* Playtime badge - bottom right */}
        {game.playtime_minutes > 0 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[11px] font-semibold text-white z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {game.playtime_minutes >= 60
              ? `${Math.floor(game.playtime_minutes / 60)}h`
              : `${game.playtime_minutes}m`
            }
          </div>
        )}

        {/* Game information overlay */}
        <div className={`absolute bottom-0 left-0 right-0 ${compact ? 'p-2' : 'p-3'} transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300`}>
          <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-[var(--text-primary)] truncate`}>{game.name}</h3>
          <div className="flex items-center justify-between mt-0.5">
            <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-300`}>
              {formatGenres(game.genres, 1)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GridGameCard; 