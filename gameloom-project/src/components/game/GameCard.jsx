// src/components/game/GameCard.jsx
import { Heart, Play, Check } from "lucide-react";
import { Link } from "react-router-dom";

const GameCard = ({ game }) => {
  return (
    <Link 
      to={`/game/${game.id}`} 
      className="block group relative overflow-hidden rounded-lg bg-surface transition-all hover:bg-surface-hover"
    >
      {/* Game Cover */}
      <div className="aspect-[3/4] overflow-hidden rounded-md">
        <img
          src={game.coverImage} 
          alt={game.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-110"
        />
      </div>

      {/* Game Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-heading truncate">
          {game.name}
        </h3>
        <p className="text-xs text-muted truncate">
          {game.genre || "Unknown Genre"}
        </p>

        {/* Rating & Actions */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-primary text-xs">★</span>
            <span className="text-xs text-muted">
              {game.rating !== "N/A" ? game.rating : "N/A"}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-1">
            <button className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-primary transition-colors">
              <Heart className="h-3 w-3" />
            </button>
            <button className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-secondary transition-colors">
              <Play className="h-3 w-3" />
            </button>
            <button className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-success transition-colors">
              <Check className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;
