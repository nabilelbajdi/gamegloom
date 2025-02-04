import React from "react";
import { Star } from "lucide-react";

const GameCard = ({ coverImage, title, genre, rating }) => {
  return (
    <div className="game-card relative group">
      {/* Cover Image */}
      <img
        src={coverImage}
        alt={title} 
        className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-102"
      />

      {/* Dark Overlay on Hover */}
      <div className="game-overlay"></div>

      {/* Game Info */}
      <div className="game-info">
        <h3 className="text font-bold truncate">{title}</h3>
        <div className="flex items-center justify-between text-xs text-gray-400">
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
