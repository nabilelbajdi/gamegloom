import React from "react";
import { Bookmark, Star, PlusCircle } from "lucide-react";

const GameHeader = ({ game }) => {
  return (
    <header className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] flex flex-col justify-end bg-black text-light">
      {/* Background Banner */}
      {game.coverImage && (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${game.coverImage})` }}
        ></div>
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex items-end gap-6 container mx-auto px-6 pb-6 md:pb-12">
        
        {/* Game Cover */}
        <img
          src={game.coverImage}
          alt={game.name}
          className="w-32 md:w-48 lg:w-56 h-auto rounded-lg shadow-lg object-cover"
        />

        {/* Game Details */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-4xl font-bold text-light">{game.name}</h1>
          <p className="text-sm md:text-base text-gray-300">
            {game.releaseDate ? `Released: ${game.releaseDate}` : "TBA"}
          </p>

          {/* Genres & Platforms */}
          <div className="flex gap-3 flex-wrap text-sm md:text-base text-gray-400">
            <span>{game.genres || "Unknown Genre"}</span>
            <span>|</span>
            <span>{game.platforms || "Unknown Platform"}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-2">
            <button className="btn-hero flex items-center gap-2">
              <PlusCircle className="w-5 h-5" /> Add to Library
            </button>
            <button className="btn-nav flex items-center gap-2">
              <Bookmark className="w-5 h-5" /> Wishlist
            </button>
            <button className="btn-nav flex items-center gap-2">
              <Star className="w-5 h-5" /> Rate
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GameHeader;
