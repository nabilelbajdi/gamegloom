// src/components/game/GameCard.jsx
import { useState } from "react";
import { Heart, Play, Check, Plus, Bookmark } from "lucide-react";
import { Link } from "react-router-dom";

const GameCard = ({ game }) => {
  const [wantToPlay, setWantToPlay] = useState(false);
  
  const handleWantToPlayClick = (e) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent event bubbling
    setWantToPlay(!wantToPlay);
    // Here you would also call your API to update the user's library
    // Something like: updateUserLibrary(game.id, !wantToPlay);
  };

  return (
    <Link 
      to={`/game/${game.igdb_id}`}
      className="block group relative overflow-hidden rounded-lg bg-surface transition-all duration-300 hover:bg-surface-hover"
    >
      {/* Game Cover */}
      <div className="aspect-[3/4] overflow-hidden rounded-md relative">
        <img
          src={game.coverImage} 
          alt={game.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.01] group-hover:opacity-90"
        />
        
        {/* Want to Play Ribbon (IMDb style) */}
        <div 
          className="absolute top-0 left-0 z-10 cursor-pointer"
          onClick={handleWantToPlayClick}
          aria-label={wantToPlay ? "Remove from Want to Play" : "Add to Want to Play"}
          role="button"
          tabIndex="0"
        >
          <svg width="30px" height="46px" viewBox="0 0 30 46" xmlns="http://www.w3.org/2000/svg" role="presentation">
            {/* Ribbon Background */}
            <polygon 
              className={`${wantToPlay ? 'fill-primary' : 'fill-black/70'} transition-colors duration-300`} 
              points="30 0 0 0 0 44 15 37 30 44"
            />
            {/* Hover Effect */}
            <polygon 
              className={`${wantToPlay ? 'fill-primary' : 'fill-primary/60 opacity-0 group-hover:opacity-100'} transition-all duration-300`} 
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
            {wantToPlay ? (
              <Check className="h-5 w-5 stroke-white" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </div>
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
            <button className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-success transition-colors cursor-pointer">
              <Check className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;
