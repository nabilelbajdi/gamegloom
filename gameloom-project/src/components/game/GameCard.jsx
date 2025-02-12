import React from "react";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GameCard = ({ coverImage, title, genre, rating, id }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="game-card relative group cursor-pointer" 
      onClick={() => navigate(`/game/${id}`)}
    >
      {/* Cover Image */}
      <img
        src={coverImage}
        alt={title} 
        className="w-full h-54 object-cover transition-transform duration-300 group-hover:scale-102"
        loading="lazy"
      />

      {/* Dark Overlay on Hover */}
      <div className="game-overlay"></div>

      {/* Game Info */}
      <div className="absolute bottom-0 p-2 w-full bg-black/80 text-white">
        <h3 className="text-sm font-bold truncate">{title}</h3>
        <div className="flex items-center justify-between text-xs text-gray-400 truncate">
          <span>{genre}</span>
          <div className="flex items-center">
            <Star className="w-3 h-3 text-primary mr-1" />
            <span>{rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
