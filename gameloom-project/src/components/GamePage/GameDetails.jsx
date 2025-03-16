// src/components/GamePage/GameDetails.jsx
import React, { useState } from "react";
import { Menu, Calendar, Gamepad2, Tags, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import StarRating from "../UI/StarRating";
import GameMediaPreview from "./GameMediaPreview";

const GameDetails = ({ game, trailer }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSummary = () => {
    setIsExpanded(!isExpanded);
  };

  // Helper function to convert string to URL-friendly slug
  const toSlug = (str) => {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  };

  return (
    <div className="pt-8 md:pt-16">
      {/* More compact header section */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div className="flex-1 max-w-2xl">
          {/* Game Title */}
          <h1 className="text-4xl font-bold leading-tight">{game.name}</h1>

          {/* Game Developers */}
          <div className="text-gray-400 text-md mt-1 line-clamp-1">
            {game.developers ? game.developers.split(", ").join(" • ") : "No developer found for this game"}
          </div>
        </div>
        
        {/* Rating Section - positioned to the right on medium+ screens */}
        <div className="md:self-start">
          <StarRating rating={game.rating} totalRatingCount={game.totalRatingCount} aggregatedRatingCount={game.aggregatedRatingCount} />
        </div>
      </div>

      {/* Separator */}
      <div className="container mx-auto my-2 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>

      {/* Media Preview Section */}
      <GameMediaPreview 
        screenshots={game.screenshots} 
        trailer={game.videos?.[0]} // Use the first video as the trailer
      />

      {/* Description Section - Moved below Media Preview */}
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

      {/* Genres and themes section */}
      {(game.genres || game.themes) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {game.genres && game.genres.replace("Role-playing (RPG)", "RPG").split(", ").map((genre, index) => (
            <Link
              key={`genre-${index}`}
              to={`/genre/${toSlug(genre)}`}
              className="inline-flex items-center gap-1.5 bg-gray-800/40 px-2.5 py-1 rounded-full text-xs font-semibold border border-gray-700/20 hover:bg-gray-700/40 transition-colors"
            >
              <Tags className="w-3 h-3 text-primary" />
              <span className="text-gray-300">{genre}</span>
            </Link>
          ))}
          {game.themes && game.themes.split(", ").map((theme, index) => (
            <Link
              key={`theme-${index}`}
              to={`/theme/${toSlug(theme)}`}
              className="inline-flex items-center gap-1.5 bg-gray-800/40 px-2.5 py-1 rounded-full text-xs font-semibold border border-gray-700/20 hover:bg-gray-700/40 transition-colors"
            >
              <Filter className="w-3 h-3 text-primary" />
              <span className="text-gray-300">{theme}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Release date and platforms section */}
      <div className="mt-4 space-y-2">
        {/* Release date */}
        {game.firstReleaseDate && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Calendar className="w-5 h-5" />
            <span>Release date: {new Date(game.firstReleaseDate).toLocaleDateString("en-US", { 
              month: "long",
              day: "numeric",
              year: "numeric",
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
