import React from 'react';
import { Link } from 'react-router-dom';

const formatRating = (rating) => (parseFloat(rating) / 20).toFixed(1);

const SearchResults = ({ results, onSelect }) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="w-full bg-[#1a1b1e] rounded-xl shadow-lg border border-gray-800/50 overflow-hidden">
      {results.map((game) => (
        <Link
          key={game.id}
          to={`/game/${game.igdb_id}`}
          className="flex items-center gap-4 p-3 hover:bg-gray-800/50 transition-colors duration-200"
          onClick={() => onSelect(game)}
        >
          {/* Game Cover */}
          <div className="w-10 h-14 rounded-md overflow-hidden flex-shrink-0 bg-gray-800">
            <img
              src={game.cover_image || game.coverImage}
              alt={game.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          
          {/* Game Info */}
          <div className="flex-grow min-w-0">
            <h4 className="text-sm font-bold text-gray-100 truncate">
              {game.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              {game.rating && (
                <div className="flex items-center gap-1">
                  <span className="text-primary text-xs">★</span>
                  <span className="text-xs text-gray-400">{formatRating(game.rating)}</span>
                </div>
              )}
              <span className="text-xs text-gray-600">•</span>
              <p className="text-xs text-gray-400 truncate">
                {game.genres || "Unknown Genre"}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default SearchResults; 