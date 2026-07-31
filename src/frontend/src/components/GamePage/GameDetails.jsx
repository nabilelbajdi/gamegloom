// src/components/GamePage/GameDetails.jsx
import React, { useState } from "react";
import { Menu, Calendar, Gamepad2, Tags, Filter, Users, Building, Monitor, Joystick, BookOpen, List, Info, Clock, Gamepad, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import StarRating from "../UI/StarRating";
import GameMediaPreview from "./GameMediaPreview";
import GameHeader from "./GameHeader";
import { shortPlatforms } from "../../utils/gameDisplay";

const GameDetails = ({ game, trailer, showHeader = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isStorylineExpanded, setIsStorylineExpanded] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);

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
      {showHeader && <GameHeader game={game} />}

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
                <span className="text-gray-300 truncate">{shortPlatforms(game.platforms)}</span>
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
                          <span>Normal: {game.time_to_beat.normally.formatted}</span>
                          {game.time_to_beat.hastily && (
                            <span> · Quick: {game.time_to_beat.hastily.formatted}</span>
                          )}
                          {game.time_to_beat.completely && (
                            <span> · Completionist: {game.time_to_beat.completely.formatted}</span>
                          )}
                        </>
                      ) : game.time_to_beat.hastily ? (
                        <span>Quick: {game.time_to_beat.hastily.formatted}</span>
                      ) : game.time_to_beat.completely ? (
                        <span>Completionist: {game.time_to_beat.completely.formatted}</span>
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
              {game.language_supports && game.language_supports.length > 0 && (() => {
                // Deduplicate languages by name
                const uniqueLanguages = Array.isArray(game.language_supports)
                  ? [...new Map(game.language_supports.map(lang => [lang.name, lang])).values()]
                  : [];
                const languageCount = uniqueLanguages.length;
                const displayedLanguages = showAllLanguages ? uniqueLanguages : uniqueLanguages.slice(0, 8);

                return (
                  <div className="flex items-start gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-gray-500">Languages: </span>
                      <span className="text-gray-300">{languageCount} languages</span>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {displayedLanguages.map((lang) => (
                          <span
                            key={lang.name}
                            className="bg-gray-800/80 text-gray-300 text-xs px-1.5 py-0.5 rounded"
                          >
                            {lang.native_name || lang.name}
                          </span>
                        ))}
                        {languageCount > 8 && !showAllLanguages && (
                          <button
                            onClick={() => setShowAllLanguages(true)}
                            className="bg-gray-700/60 text-primary text-xs px-1.5 py-0.5 rounded hover:bg-gray-600/60 transition-colors cursor-pointer"
                          >
                            +{languageCount - 8} more
                          </button>
                        )}
                        {showAllLanguages && languageCount > 8 && (
                          <button
                            onClick={() => setShowAllLanguages(false)}
                            className="bg-gray-700/60 text-primary text-xs px-1.5 py-0.5 rounded hover:bg-gray-600/60 transition-colors cursor-pointer"
                          >
                            Show less
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
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
