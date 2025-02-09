import React, { useState } from "react";
import { Bookmark, Star, PlusCircle, ChevronDown, ChevronUp } from "lucide-react";

const GameHero = ({ game }) => {
  const [expanded, setExpanded] = useState(false);

  // Use first screenshot as background, fallback to cover image if unavailable
  const backgroundImage = game.screenshots?.length > 0 
    ? game.screenshots[0] 
    : game.coverImage;

  return (
    <div className="w-full">
      <section className="w-full relative">
        
        {/* Background Image */}
        {backgroundImage && (
          <div
          className="absolute inset-0 w-full h-full bg-cover bg-center brightness-[0.6]"
          style={{ backgroundImage: `url(${backgroundImage})` }}
          ></div>
        )}

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end gap-6 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 lg:py-20">        
          
          {/* Game Cover (Small) */}
          <div className="w-full flex justify-center md:justify-start">
            <img
              src={game.coverImage}
              alt={game.name}
              className="w-32 sm:w-40 md:w-52 lg:w-64 h-auto rounded-lg shadow-lg object-cover"
            />
          </div>

          {/* Game Details */}
          <div className="flex flex-col gap-3 w-full max-w-3xl text-center md:text-left">
            <h1 className="text-[clamp(1.8rem,5vw,3rem)] font-bold">{game.name}</h1>
            <p className="text-sm sm:text-base text-gray-300">
              {game.releaseDate ? `Released: ${game.releaseDate}` : "TBA"}
            </p>

            {/* Genres & Platforms */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 text-sm sm:text-base text-gray-400">
              <span>{game.genres || "Unknown Genre"}</span>
              <span>|</span>
              <span>{game.platforms || "Unknown Platform"}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
              <button className="btn-hero flex items-center gap-2 px-5 py-3 text-sm sm:text-base rounded-lg shadow-md hover:shadow-lg transition-all">
                <PlusCircle className="w-5 h-5" /> Add to Library
              </button>
              <button className="btn-nav flex items-center gap-2 px-5 py-3 text-sm sm:text-base rounded-lg shadow-md hover:shadow-lg transition-all">
                <Bookmark className="w-5 h-5" /> Wishlist
              </button>
              <button className="btn-nav flex items-center gap-2 px-5 py-3 text-sm sm:text-base rounded-lg shadow-md hover:shadow-lg transition-all">
                <Star className="w-5 h-5" /> Rate
              </button>
            </div>

            {/* Game Description */}
            {game.summary && (
              <div className="mt-6 bg-gray-900/80 p-4 rounded-lg">
                <h2 className="text-lg sm:text-xl font-semibold text-light mb-2">About the Game</h2>
                <p className={`text-gray-300 text-sm sm:text-base ${expanded ? "" : "line-clamp-3"}`}>
                  {game.summary}
                </p>
                {game.summary.length > 300 && (
                  <button 
                    onClick={() => setExpanded(!expanded)} 
                    className="flex items-center justify-center md:justify-start text-primary text-sm mt-2 hover:text-primary/80 transition-colors"
                  >
                    {expanded ? "Show Less" : "Read More"} 
                    {expanded ? <ChevronUp className="ml-1 w-4 h-4" /> : <ChevronDown className="ml-1 w-4 h-4" />}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default GameHero;
