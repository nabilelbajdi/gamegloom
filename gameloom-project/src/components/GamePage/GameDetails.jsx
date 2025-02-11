import React, { useState } from "react";
import { Image as ImageIcon, Menu, Clock, Calendar, Gamepad2 } from 'lucide-react';

const GameDetails = ({ game, trailer, timeToBeat }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSummary = () => {
    setIsExpanded(!isExpanded);
  };

  // Helper function to generate stars based on decimal rating
  const getStarRating = (rating, releaseDate) => {
    const maxStars = 5;
    const isUnreleased = !releaseDate || new Date(releaseDate) > new Date();
  
    if (!rating || rating === "N/A") {
      return (
        <div className="flex items-center text-gray-500 text-2xl">
          {[...Array(maxStars)].map((_, i) => (
            <span key={i}>★</span>
          ))}
          <span className="text-base ml-2">
            {isUnreleased ? "This game has no ratings yet" : "Ratings available after release"}
          </span>
        </div>
      );
    }
  
    const fullStars = Math.floor(rating);
    const decimalPart = rating - fullStars;
    const emptyStars = maxStars - Math.ceil(rating);
  
    return (
      <div className="flex items-center text-primary text-2xl">
        {/* Full Stars */}
        {[...Array(fullStars)].map((_, i) => <span key={i}>★</span>)}
  
        {/* Partial Star */}
        {decimalPart > 0 && (
          <span className="relative">
            <span className="text-gray-500">★</span>
            <span className="absolute top-0 left-0 overflow-hidden" style={{ width: `${decimalPart * 100}%` }}>
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
      <div className="text-gray-400 text-md mt-2 line-clamp-1">
        {game.developers ? game.developers.split(", ").join(" • ") : "No developer found for this game"}
      </div>

      {/* Rating Section */}
      <div className="text-gray-400 text-md sm:text-base flex items-center gap-4 mt-2">
        {getStarRating(game.aggregatedRating, game.releaseDate)}
        <span className="text-2xl">
          {game.aggregatedRating !== "N/A" ? (
            <>
              {game.aggregatedRating}
              <span className="text-sm">/5.0</span>
            </>
          ) : ""}
        </span>
        {game.totalRatings > 0 && <span className="text-sm">{game.totalRatings} ratings</span>}
      </div>

      {/* Separator */}
      <div className="container mx-auto my-2 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>

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
            <button onClick={toggleSummary} className="text-blue-500 text-xs cursor-pointer">
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
              <img key={index} src={screenshot} alt={`Screenshot ${index + 1}`} className="w-full h-auto object-cover rounded-lg shadow-md" />
            ))}
            {game.screenshots.length > 3 && (
              <div className="relative w-full h-auto rounded-lg shadow-md overflow-hidden">
                <img src={game.screenshots[3]} alt="Screenshot 4" className="w-full h-full object-cover filter blur-sm" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="text-white mr-2" />
                  <span className="text-white text-sm cursor-pointer">View More</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Genres and themes section */}
      {(game.genres || game.themes) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {game.genres && game.genres.replace("Role-playing (RPG)", "RPG").split(", ").map((genre, index) => (
            <span
              key={`genre-${index}`}
              className="bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-full cursor-pointer hover:bg-gray-700"
            >
              {genre}
            </span>
          ))}
          {game.themes && game.themes.split(", ").map((theme, index) => (
            <span
              key={`theme-${index}`}
              className="bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-full cursor-pointer hover:bg-gray-700"
            >
              {theme}
            </span>
          ))}
        </div>
      )}

      {/* Time to beat, release date and platforms section */}
      <div className="mt-4 space-y-2">
        {/* Time to beat */}
        {timeToBeat && timeToBeat.normally && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock className="w-5 h-5" />
            <span>
              Approximate time to beat: {timeToBeat.normally ? ` ${(timeToBeat.normally / 3600).toFixed(0)} hours` : " Unknown"}
            </span>
          </div>
        )}

        {/* Release date */}
        {game.releaseDate && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Calendar className="w-5 h-5" />
            <span>Release date: {game.releaseDate}</span>
          </div>
        )}

        {/* Platforms */}
        {game.platforms && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Gamepad2 className="w-5 h-5" />
            <span>
              Platforms: {game.platforms
                .replace("PC (Microsoft Windows)", "PC")
                .replace("PlayStation 5", "PS5")
                .replace("PlayStation 4", "PS4")
                .replace("Nintendo Switch", "Switch")
                .replace("PlayStation 3", "PS3")
                .replace("PlayStation 2", "PS2")
                .split(", ")
                .sort()
                .join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDetails;
