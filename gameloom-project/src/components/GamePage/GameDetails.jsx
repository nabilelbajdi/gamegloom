import React, { useState } from "react";
import { Image as ImageIcon, Menu } from 'lucide-react';

const GameDetails = ({ game, timeToBeat, trailer }) => {
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
      <div className="text-gray-400 text-md mt-2">
        {game.developers ? game.developers.split(", ").slice(0, 3).join(" • ") : "Unknown"}
      </div>

      {/* Rating Section */}
      <div className="text-gray-400 text-md sm:text-base flex items-center gap-4 mt-2">
        {getStarRating(game.aggregatedRating)}
        <span className="text-lg">{game.aggregatedRating !== "N/A" ? `${game.aggregatedRating}/5.0` : ""}</span>
        {game.totalRatings && <span className="text-sm">{game.totalRatings} ratings</span>}
      </div>

      {/* Seperator */}
      <div className="container mx-auto my-6 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>

      {/* Description Section */}
      <div className="mt-6">
        <div className="flex items-center gap-2 text-gray-400 text-md font-semibold">
          <Menu className="w-5 h-5" />
          <span>DESCRIPTION</span>
        </div>

        <div className="text-gray-300 mt-2 text-sm">
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
      </div>

      {/* Game Trailer and Screenshots */}
      <div className="flex flex-col md:flex-row gap-4 mt-6 items-start">
        {trailer && (
          <div className="flex-shrink-0 w-full md:w-1/2">
            <iframe
              width="100%"
              height="200"
              src={trailer}
              title="Game Trailer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg shadow-md"
            ></iframe>
          </div>
        )}
        {game.screenshots && game.screenshots.length > 0 && (
          <div className="grid grid-cols-2 gap-2 w-full md:w-1/2">
            {game.screenshots.slice(0, 3).map((screenshot, index) => (
              <img
                key={index}
                src={screenshot}
                alt={`Screenshot ${index + 1}`}
                className="w-full h-auto object-cover rounded-lg shadow-md"
              />
            ))}
            {game.screenshots.length > 3 && (
              <div className="relative w-full h-auto rounded-lg shadow-md overflow-hidden">
                <img
                  src={game.screenshots[3]}
                  alt="Screenshot 4"
                  className="w-full h-full object-cover filter blur-sm"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="text-white mr-2" />
                  <span className="text-white text-sm cursor-pointer">View More</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDetails;
