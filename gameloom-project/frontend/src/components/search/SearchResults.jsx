import React from 'react';
import { Link } from 'react-router-dom';

const formatRating = (rating) => (parseFloat(rating) / 20).toFixed(1);

const SearchResults = ({ results, onSelect, category = "all" }) => {
  if (!results || results.length === 0) return null;

  // Helper function to determine what text to display based on category
  const getCategoryInfo = (game) => {
    switch(category) {
      case "developers":
        return { label: "Developer", value: game.developers || "Unknown Developer" };
      case "platforms":
        return { label: "Platforms", value: game.platforms || "Unknown Platform" };
      default:
        return { label: "Genre", value: game.genres || "Unknown Genre" };
    }
  };

  return (
    <div className="w-full bg-[#1a1b1e] rounded-xl shadow-lg border border-gray-800/50 overflow-hidden">
      {results.map((game) => {
        const categoryInfo = getCategoryInfo(game);
        
        return (
          <Link
            key={game.id}
            to={`/game/${game.slug || game.igdb_id}`}
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
                  {category === "developers" && <span className="text-gray-500">{categoryInfo.label}: </span>}
                  {category === "platforms" && <span className="text-gray-500">{categoryInfo.label}: </span>}
                  {categoryInfo.value}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default SearchResults; 