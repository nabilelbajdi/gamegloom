import React, { useState } from "react";

const GameDetails = ({ game }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSummary = () => {
    setIsExpanded(!isExpanded);
  };

  // Helper function to generate stars based on decimal rating
  const getStarRating = (rating) => {
    if (!rating || rating === "N/A") return <span className="text-gray-500">No ratings yet.</span>;

    const maxStars = 5;
    const fullStars = Math.floor(rating);
    const decimalPart = rating - fullStars;
    const emptyStars = maxStars - Math.ceil(rating);

    return (
      <div className="flex items-center text-yellow-400 text-2xl">
        {/* Full Stars */}
        {[...Array(fullStars)].map((_, i) => <span key={i}>★</span>)}

        {/* Partial Star */}
        {decimalPart > 0 && (
          <span className="relative">
            <span className="text-gray-500">★</span>
            <span
              className="absolute top-0 left-0 overflow-hidden"
              style={{ width: `${decimalPart * 100}%` }}
            >
              ★
            </span>
          </span>
        )}

        {/* Empty Stars */}
        {[...Array(emptyStars)].map((_, i) => <span key={i} className="text-gray-500">★</span>)}
      </div>
    );
  };

  return (
    <div className="py-12">
      {/* Game Title */}
      <h1 className="text-5xl font-bold leading-tight">{game.name}</h1>

      {/* Game Developers */}
      <div className="text-gray-400 text-sm sm:text-base">
        {game.developers.split(", ").slice(0, 3).join(" • ") || "Unknown"}
      </div>

      {/* Rating Section */}
      <div className="text-gray-400 text-md sm:text-base flex items-center gap-4 mt-2">
        {getStarRating(game.aggregatedRating)}
        <span className="text-lg">{game.aggregatedRating !== "N/A" ? `${game.aggregatedRating}/5.0` : ""}</span>
        {game.totalRatings && <span className="text-sm">{game.totalRatings} ratings</span>}
      </div>

      {/* Game Summary */}
      <div className="text-gray-300 mt-4">
        <p className={isExpanded ? "" : "line-clamp-3"}>
          {game.summary}
        </p>
        {game.summary.length > 300 && (
          <button
            onClick={toggleSummary}
            className="text-blue-500 text-xs cursor-pointer"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        )}
      </div>

      {/* 🎭 Game Genres */}
      <div className="text-gray-400 text-xs flex flex-wrap gap-2 mt-4">
        {game.genres.split(", ").map((genre, index) => (
          <span key={index} className="bg-gray-700 px-2 py-1 rounded">{genre}</span>
        ))}
      </div>

      {/* 📋 Additional Meta Info */}
      <div className="flex flex-col gap-2 mt-6 text-gray-400 text-sm">
        <p><strong>Time to Beat:</strong> {game.playtime || "Unknown"}</p>
        <p><strong>Release Date:</strong> {game.releaseDate}</p>
        <p><strong>Platforms:</strong> {game.platforms}</p>
        <p><strong>Theme:</strong> {game.themes}</p>
      </div>
    </div>
  );
};

export default GameDetails;
