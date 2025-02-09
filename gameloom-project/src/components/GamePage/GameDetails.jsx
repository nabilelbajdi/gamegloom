import React, { useState } from "react";

const GameDetails = ({ game }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSummary = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="py-12">
      {/* Game Title */}
      <h1 className="text-5xl font-bold leading-tight">{game.name}</h1>

      {/* Game Developers */}
      <div className="text-gray-400 text-sm sm:text-base">
        {game.developers.split(", ").slice(0, 3).join(" • ") || "Unknown"}
      </div>
        
      {/* Rating, Total Ratings */}
      <div className="text-gray-400 text-md sm:text-base flex items-center gap-4">
        <div className="flex items-center text-3xl space-x-1 mt-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={`text-yellow-500 ${i < Math.round(game.aggregatedRating / 2) ? 'fill-current' : 'text-gray-500'}`}>
              ★
            </span>
          ))}
        </div>
        <span className="text-xl mt-2">
          {game.aggregatedRating !== "N/A" ? `${game.aggregatedRating}/5.0` : "This game has no ratings yet."}
        </span>
        {game.aggregatedRating !== "N/A" && (
          <span className="text-sm mt-2">
            {game.totalRatings} ratings
          </span>
        )}
      </div>

      {/* Game Summary */}
      <div className="text-gray-300 mt-4">
        <p className={isExpanded ? '' : 'line-clamp-3'}>
          {game.summary}
        </p>
        <button
          onClick={toggleSummary}
          className="text-blue-500 text-xs cursor-pointer"
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>
      </div>

      {/* Game Genres */}
      <div className="text-gray-400 text-xs flex flex-wrap gap-2 mt-4">
        {game.genres.split(", ").map((genre, index) => (
          <span key={index} className="bg-gray-700 px-2 py-1 rounded">
            {genre}
          </span>
        ))}
      </div>
    </div>
  );
};

export default GameDetails;
