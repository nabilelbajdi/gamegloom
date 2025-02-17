// src/components/GamePage/GameDetails.jsx
import React, { useState } from "react";
import { Menu, Clock, Calendar, Gamepad2 } from 'lucide-react';
import StarRating from "../UI/StarRating";
import GameMediaPreview from "./GameMediaPreview";

const GameDetails = ({ game, trailer, timeToBeat }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSummary = () => {
    setIsExpanded(!isExpanded);
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
      <div className="mt-4 mb-6">
        <StarRating rating={game.rating} totalRatingCount={game.totalRatingCount} />
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
          {game.summary?.length > 300 && (
            <button onClick={toggleSummary} className="text-blue-500 text-xs cursor-pointer">
              {isExpanded ? "Show Less" : "Show More"}
            </button>
          )}
        </div>
      </div>

      {/* Media Preview Section */}
      <GameMediaPreview 
        screenshots={game.screenshots} 
        trailer={game.videos?.[0]} // Use the first video as the trailer
      />

      {/* Genres and themes section */}
      {(game.genre || game.themes) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {game.genre && game.genre.replace("Role-playing (RPG)", "RPG").split(", ").map((genre, index) => (
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
        {game.firstReleaseDate && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Calendar className="w-5 h-5" />
            <span>Release date: {new Date(game.firstReleaseDate).toLocaleDateString('en-US', { 
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}</span>
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
