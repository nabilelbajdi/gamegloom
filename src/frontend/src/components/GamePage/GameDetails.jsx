// src/components/GamePage/GameDetails.jsx
import React, { useState } from "react";
import { Menu, Calendar, Gamepad2, Tags, Filter, Users, Building, Monitor, Joystick, BookOpen, List, Info, Clock, Gamepad, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import StarRating from "../UI/StarRating";
import GameMediaPreview from "./GameMediaPreview";

const GameDetails = ({ game, trailer }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isStorylineExpanded, setIsStorylineExpanded] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  const toggleSummary = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleStoryline = () => {
    setIsStorylineExpanded(!isStorylineExpanded);
  };
  
  const toggleDetails = () => {
    setIsDetailsExpanded(!isDetailsExpanded);
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
    <div className="pt-6 md:pt-12">
      {/* Header section */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex-1">
          {/* Game Title */}
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white">{game.name}</h1>
          {/* Quick Info: Game Type, Developer, Release Year, Time to Beat */}
          <div className="flex items-center text-gray-400 text-sm font-semibold mt-1 gap-3">
            {/* Game Type */}
            {game.game_type_name && (
              <span className="inline-flex items-center gap-1">
                <Gamepad className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>{game.game_type_name}</span>
              </span>
            )}
            
            {game.game_type_name && (game.developers || game.firstReleaseDate || game.time_to_beat?.normally) && (
              <div className="h-3 w-px bg-gray-700"></div>
            )}
            
            {/* Developer */}
            {game.developers && (
              <span className="inline-flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>{game.developers.split(", ")[0]}</span>
              </span>
            )}
            
            {game.developers && (game.firstReleaseDate || game.time_to_beat?.normally) && (
              <div className="h-3 w-px bg-gray-700"></div>
            )}
            
            {/* Release Year */}
            {game.firstReleaseDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>{new Date(game.firstReleaseDate).getFullYear()}</span>
              </span>
            )}
            
            {game.firstReleaseDate && game.time_to_beat?.normally && (
              <div className="h-3 w-px bg-gray-700"></div>
            )}
            
            {/* Time to Beat */}
            {game.time_to_beat?.normally && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>{game.time_to_beat.normally.formatted}</span>
              </span>
            )}
          </div>
        </div>
        
        {/* Rating Section */}
        <div className="flex-shrink-0">
          <StarRating rating={game.rating} totalRatingCount={game.totalRatingCount} aggregatedRatingCount={game.aggregatedRatingCount} firstReleaseDate={game.firstReleaseDate} />
        </div>
      </div>

      {/* Separator */}
      <div className="container mx-auto my-2 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>

      {/* Media Preview Section */}
      <GameMediaPreview 
        screenshots={game.screenshots} 
        trailer={game.videos?.[0]}
      />

      {/* Description Section */}
      <div className="mt-4">
        <div className="flex items-center gap-2 text-gray-400 text-sm font-bold mb-1">
          <Menu className="w-4 h-4" />
          <span>DESCRIPTION</span>
        </div>

        <div className="text-gray-300 text-sm">
          <p className={`${isExpanded ? "" : "line-clamp-2"} font-medium`}>
            {game.summary}
          </p>
          {game.summary?.length > 300 && (
            <button onClick={toggleSummary} className="text-primary text-xs cursor-pointer font-semibold">
              {isExpanded ? "Show Less" : "Show More"}
            </button>
          )}
        </div>
      </div>

      {/* Genres and themes section */}
      {(game.genres || game.themes) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {game.genres && game.genres.replace("Role-playing (RPG)", "RPG").split(", ").map((genre, index) => (
            <Link
              key={`genre-${index}`}
              to={`/genre/${toSlug(genre)}`}
              className="inline-flex items-center gap-1 bg-gray-800/40 px-2 py-0.5 rounded-full text-xs font-semibold border border-gray-700/20 hover:bg-gray-700/40 transition-colors"
            >
              <Tags className="w-3 h-3 text-primary" />
              <span className="text-gray-300">{genre}</span>
            </Link>
          ))}
          {game.themes && game.themes.split(", ").map((theme, index) => (
            <Link
              key={`theme-${index}`}
              to={`/theme/${toSlug(theme)}`}
              className="inline-flex items-center gap-1 bg-gray-800/40 px-2 py-0.5 rounded-full text-xs font-semibold border border-gray-700/20 hover:bg-gray-700/40 transition-colors"
            >
              <Filter className="w-3 h-3 text-primary" />
              <span className="text-gray-300">{theme}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Game Information Section */}
      <div className="mt-4 bg-surface-dark p-3 rounded-md border-[0.5px] border-gray-800/30">
        <div className="flex items-center justify-between gap-1.5 text-gray-400 text-sm font-bold mb-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4" />
            <span>DETAILS</span>
          </div>
          
          {game.time_to_beat || game.publishers || game.gameModes || game.playerPerspectives || game.franchise || 
           (game.game_engines && game.game_engines.length > 0) || 
           (game.language_supports && game.language_supports.length > 0) ? (
            <button 
              onClick={toggleDetails} 
              className="text-primary text-xs flex items-center gap-0.5 hover:text-primary/80 transition"
            >
              {isDetailsExpanded ? (
                <>
                  <span>Show less</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Show more</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          ) : null}
        </div>

        <div className="flex flex-col space-y-2 text-xs">
          {/* Always visible details (first 3) */}
          
          {/* Release date */}
          {game.firstReleaseDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>
                <span className="text-gray-500">Release: </span>
                <span className="text-gray-300">{new Date(game.firstReleaseDate).toLocaleDateString("en-US", { 
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}</span>
              </span>
            </div>
          )}

          {/* Platforms */}
          {game.platforms && (
            <div className="flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>
                <span className="text-gray-500">Platforms: </span>
                <span className="text-gray-300 truncate">{game.platforms
                  .replace("PC (Microsoft Windows)", "PC")
                  .replace("PlayStation 5", "PS5")
                  .replace("PlayStation 4", "PS4")
                  .replace("Nintendo Switch", "Switch")
                  .replace("PlayStation 3", "PS3")
                  .replace("PlayStation 2", "PS2")
                  .split(", ")
                  .sort()
                  .join(", ")}</span>
              </span>
            </div>
          )}

          {/* Developers */}
          {game.developers && (
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>
                <span className="text-gray-500">Developers: </span>
                <span className="text-gray-300 truncate">{game.developers}</span>
              </span>
            </div>
          )}

          {/* Additional details that show when expanded */}
          {isDetailsExpanded && (
            <>
              {/* Time to Beat */}
              {game.time_to_beat && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>
                    <span className="text-gray-500">Time to Beat: </span>
                    <span className="text-gray-300">
                      {game.time_to_beat.normally ? (
                        <>
                          <span className="text-primary">{game.time_to_beat.normally.formatted}</span>
                          {game.time_to_beat.hastily && (
                            <span className="text-gray-500"> (Quick: {game.time_to_beat.hastily.formatted})</span>
                          )}
                          {game.time_to_beat.completely && (
                            <span className="text-gray-500"> (100%: {game.time_to_beat.completely.formatted})</span>
                          )}
                        </>
                      ) : game.time_to_beat.hastily ? (
                        <span>Quick: {game.time_to_beat.hastily.formatted}</span>
                      ) : game.time_to_beat.completely ? (
                        <span>100%: {game.time_to_beat.completely.formatted}</span>
                      ) : (
                        <span>Not available</span>
                      )}
                    </span>
                  </span>
                </div>
              )}

              {/* Publishers */}
              {game.publishers && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>
                    <span className="text-gray-500">Publishers: </span>
                    <span className="text-gray-300 truncate">{game.publishers}</span>
                  </span>
                </div>
              )}

              {/* Game Modes */}
              {game.gameModes && (
                <div className="flex items-center gap-1.5">
                  <Joystick className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>
                    <span className="text-gray-500">Modes: </span>
                    <span className="text-gray-300 truncate">{game.gameModes}</span>
                  </span>
                </div>
              )}

              {/* Player Perspectives */}
              {game.playerPerspectives && (
                <div className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>
                    <span className="text-gray-500">Perspective: </span>
                    <span className="text-gray-300 truncate">{game.playerPerspectives}</span>
                  </span>
                </div>
              )}

              {/* Franchise */}
              {game.franchise && (
                <div className="flex items-center gap-1.5">
                  <List className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>
                    <span className="text-gray-500">Franchise: </span>
                    <span className="text-gray-300 truncate">{game.franchise}</span>
                  </span>
                </div>
              )}
              
              {/* Game Engines */}
              {game.game_engines && game.game_engines.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Gamepad className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>
                    <span className="text-gray-500">Engine: </span>
                    <span className="text-gray-300 truncate">
                      {Array.isArray(game.game_engines) 
                        ? game.game_engines.join(", ") 
                        : game.game_engines}
                    </span>
                  </span>
                </div>
              )}
              
              {/* Language Support */}
              {game.language_supports && game.language_supports.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 w-full">
                    <Monitor className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="text-gray-500">Languages: </span>
                  </div>
                  <div className="ml-5 flex flex-wrap gap-1">
                    {Array.isArray(game.language_supports) && game.language_supports.map((lang, index) => (
                      <span 
                        key={index} 
                        className="bg-gray-800/80 text-gray-300 text-xs px-1.5 py-0.5 rounded"
                      >
                        {lang.native_name || lang.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Storyline */}
        {game.storyline && game.storyline !== game.summary && (
          <div className="mt-3 pt-3 border-t border-gray-800/50">
            <div className="flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-gray-500 text-xs font-semibold">Storyline:</span>
            </div>
            <div className="text-gray-300 text-xs">
              <p className={`${isStorylineExpanded ? "" : "line-clamp-3"} font-medium`}>
                {game.storyline}
              </p>
              {game.storyline?.length > 200 && (
                <button onClick={toggleStoryline} className="text-primary text-xs cursor-pointer font-semibold">
                  {isStorylineExpanded ? "Show Less" : "Show More"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDetails;
