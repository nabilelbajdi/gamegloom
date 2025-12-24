import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, Check, Plus, Tags, Play, Trophy } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useUserGameStore from "../../store/useUserGameStore";

const GameListCard = ({ game, index }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addGame, removeGame, getGameStatus, updateStatus } = useUserGameStore();
  const gameStatus = getGameStatus(game.id);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const handleStatusClick = async (e, status = null) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) {
      navigate("/login");
      return;
    }

    if (status === null) {
      setShowStatusDropdown(!showStatusDropdown);
      return;
    }

    try {
      if (status === gameStatus) {
        await removeGame(game.id);
      }
      else if (gameStatus) {
        await updateStatus(game.id, status);
      }
      else {
        await addGame(game.id, status);
      }

      setShowStatusDropdown(false);
    } catch (error) {
      console.error("Failed to update game status:", error);
    }
  };

  const getRibbonColor = () => {
    if (!gameStatus) return 'fill-black/70';

    switch (gameStatus) {
      case 'want_to_play': return 'fill-primary';
      case 'playing': return 'fill-secondary';
      case 'played': return 'fill-gray-300';
      default: return 'fill-black/70';
    }
  };

  const getHoverColor = () => {
    if (!gameStatus) return 'fill-white/20';

    switch (gameStatus) {
      case 'want_to_play': return 'fill-primary/30';
      case 'playing': return 'fill-secondary/30';
      case 'played': return 'fill-gray-300/30';
      default: return 'fill-white/20';
    }
  };

  const getRibbonIcon = () => {
    if (!gameStatus) return <Plus className="h-3 w-3" />;

    switch (gameStatus) {
      case 'want_to_play': return <Check className="h-3 w-3 stroke-white" />;
      case 'playing': return <span className="text-xs">▶</span>;
      case 'played': return <span className="text-xs">🏆</span>;
      default: return <Plus className="h-3 w-3" />;
    }
  };

  // Get display genres
  const getDisplayGenres = () => {
    if (!game.genres) return [];

    const genreArray = typeof game.genres === "string"
      ? game.genres.split(",").map(g => g.trim())
      : Array.isArray(game.genres) ? game.genres.map(g => g.trim()) : [];

    return genreArray.slice(0, 3);
  };

  const getReleaseYear = () => {
    const releaseDate = game.firstReleaseDate || game.first_release_date || game.release_date;
    if (!releaseDate) return null;

    try {
      return new Date(releaseDate).getFullYear();
    } catch {
      return null;
    }
  };

  const releaseYear = getReleaseYear();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'want_to_play': return <Check className="h-3 w-3" />;
      case 'playing': return <Play className="h-3 w-3" />;
      case 'played': return <span className="text-[8px] leading-none">🏆</span>;
      default: return <Plus className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'want_to_play': return 'text-primary';
      case 'playing': return 'text-secondary';
      case 'played': return 'text-gray-200';
      default: return 'text-white';
    }
  };

  const handleCoverMouseLeave = () => {
    if (showStatusDropdown) {
      setShowStatusDropdown(false);
    }
  };

  return (
    <div className="flex items-stretch overflow-hidden max-w-3xl">
      {/* Game Cover with Ribbon */}
      <Link
        to={`/game/${game.slug || game.igdb_id}`}
        className="w-16 md:w-20 shrink-0 relative overflow-hidden group cursor-pointer rounded-lg"
        onMouseLeave={handleCoverMouseLeave}
      >
        <img
          src={game.coverImage}
          alt={game.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.01] group-hover:opacity-90 rounded-lg"
        />

        {/* Status Ribbon */}
        <div className="absolute top-0 left-0 z-10">
          <div
            className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={(e) => handleStatusClick(e)}
            aria-label={gameStatus ? `Status: ${gameStatus.replace('_', ' ')}` : "Add to collection"}
            role="button"
            tabIndex="0"
          >
            <svg
              width="18px"
              height="27px"
              viewBox="0 0 30 46"
              xmlns="http://www.w3.org/2000/svg"
              role="presentation"
              preserveAspectRatio="xMinYMin meet"
            >
              {/* Ribbon Background */}
              <polygon
                className={`${getRibbonColor()} transition-colors duration-300`}
                points="30 0 0 0 0 44 15 37 30 44"
              />
              {/* Hover Effect*/}
              <polygon
                className={`${!gameStatus ? `${getHoverColor()} opacity-0 group-hover:opacity-100 backdrop-blur-sm` : getHoverColor()} transition-all duration-300`}
                points="30 0 0 0 0 44 15 37 30 44"
              />
              {/* Shadow */}
              <polygon
                className="fill-black/40"
                points="30 44 30 46 15 39 0 46 0 44 15 37"
              />
            </svg>

            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center text-white" style={{ paddingBottom: "4px" }}>
              {getRibbonIcon()}
            </div>
          </div>

          {/* Status Icons Dropdown - Only show if user is logged in */}
          {showStatusDropdown && user && (
            <div
              className="absolute top-[26px] left-0 z-20 flex bg-surface-dark rounded shadow-md border border-gray-800/50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Vertical stack of status icons */}
              <div className="flex flex-col divide-y divide-gray-800/30">
                {["want_to_play", "playing", "played"].map((status) => (
                  <button
                    key={status}
                    onClick={(e) => handleStatusClick(e, status)}
                    className={`
                      p-1 flex items-center justify-center w-5 h-5
                      ${gameStatus === status ? 'bg-gray-800/80' : 'hover:bg-gray-800/50'}
                      ${getStatusColor(status)}
                      transition-colors duration-200
                    `}
                    title={status.replace(/_/g, " ")}
                  >
                    {getStatusIcon(status)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hover overlay - matching GameCard.jsx */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </Link>

      {/* Game Details - Connected to the cover */}
      <div className="flex-1 p-3 flex flex-col justify-between relative">
        <div>
          <h3 className="font-semibold text-sm">
            <Link
              to={`/game/${game.slug || game.igdb_id}`}
              className="text-white hover:text-primary transition-colors duration-200"
            >
              {game.name}
            </Link>
            {releaseYear && (
              <>
                <span className="text-gray-500 mx-1.5">•</span>
                <span className="text-gray-500 text-xs font-normal">{releaseYear}</span>
              </>
            )}
          </h3>

          {/* Genres */}
          <div className="mt-2 flex flex-wrap gap-1">
            {getDisplayGenres().map((genre, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-1.5 py-0.5 bg-primary/5 text-xs text-gray-300 font-semibold rounded-full"
              >
                <Tags className="w-2.5 h-2.5 text-primary" />
                {genre}
              </span>
            ))}
          </div>

          {/* Rating Badge */}
          {game.rating !== "N/A" && (
            <div className="mt-6 ml-1 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              <span className="text-xs font-semibold text-white">{game.rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameListCard; 