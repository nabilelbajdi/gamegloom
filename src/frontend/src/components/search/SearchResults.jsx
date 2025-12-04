import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatRating } from '../../utils/gameUtils';
import { ChevronRight } from 'lucide-react';

// Skeleton loader for search results
const SearchResultsSkeleton = () => {
  return (
    <div className="w-full bg-[rgb(26,27,30)] rounded-xl shadow-lg border border-gray-800/50 overflow-hidden">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-3 animate-pulse">
          {/* Game Cover Skeleton */}
          <div className="w-10 h-14 rounded-md overflow-hidden flex-shrink-0 bg-gray-800"></div>
          
          {/* Game Info Skeleton */}
          <div className="flex-grow min-w-0">
            <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
            <div className="flex items-center gap-2">
              <div className="h-3 bg-gray-800 rounded w-16"></div>
              <div className="h-3 bg-gray-800 rounded w-24"></div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Skeleton footer */}
      <div className="w-full bg-[#1a1b1e] border-t border-gray-800/50 p-2 flex justify-center">
        <div className="w-full mx-3 py-1.5 bg-gray-800 rounded h-8 animate-pulse"></div>
      </div>
    </div>
  );
};

const SearchResults = ({ results, onSelect, category = "all", isLoading = false, searchQuery = "" }) => {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // 
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!results || results.length === 0) return;
      
      // Only handle navigation if the dropdown is visible
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          // If at the "View more" button, cycle back to first result
          if (selectedIndex === results.length) {
            setSelectedIndex(0);
          } else {
            setSelectedIndex(prev => Math.min(prev + 1, results.length));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          // If at first result, cycle to "View more" button
          if (selectedIndex === 0) {
            setSelectedIndex(results.length);
          } else {
            setSelectedIndex(prev => Math.max(prev - 1, -1));
          }
          break;
        case 'Enter':
          if (selectedIndex >= 0) {
            e.preventDefault();
            // If View More button is selected
            if (selectedIndex === results.length) {
              handleViewMore();
            } 
            // If a game is selected
            else if (selectedIndex < results.length) {
              const selectedGame = previewResults[selectedIndex];
              navigate(`/game/${selectedGame.slug || selectedGame.igdb_id}`);
              onSelect(selectedGame);
            }
          }
          break;
        case 'Escape':
          onSelect(null);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, navigate, onSelect]);

  if (isLoading) {
    return <SearchResultsSkeleton />;
  }
  
  if (!results || results.length === 0) return null;

  // Helper function to determine what text to display based on category
  const getCategoryInfo = (game) => {
    switch(category) {
      case "developers":
        return { label: "Developer", value: game.developers || "Unknown Developer" };
      case "platforms":
        // Mapping of platform names to abbreviated versions
        const platformToAbbreviation = {
          "PlayStation 5": "PS5",
          "PlayStation 4": "PS4",
          "PlayStation 3": "PS3",
          "PlayStation 2": "PS2",
          "PlayStation": "PS1",
          "Xbox Series X|S": "XSX",
          "Xbox One": "Xbox One",
          "Xbox 360": "X360",
          "Xbox": "Xbox",
          "Nintendo Switch": "Switch",
          "Wii U": "Wii U",
          "Nintendo 3DS": "3DS",
          "PC (Microsoft Windows)": "PC"
        };
        
        // Format platforms with abbreviations
        const formattedPlatforms = game.platforms ? game.platforms.split(", ").map(platform => {
          return platformToAbbreviation[platform] || platform;
        }).join(", ") : "Unknown Platform";
        
        return { label: "Platforms", value: formattedPlatforms };
      case "keywords":
        // Handle keywords array, join with commas if it exists
        let keywordsList = "No keywords";
        
        if (game.keywords && Array.isArray(game.keywords)) {
          // Get the lowercase search query for matching
          const lowerSearchQuery = searchQuery.toLowerCase();
          
          // Prioritize the matching keyword by putting it first
          const sortedKeywords = [...game.keywords].sort((a, b) => {
            const aMatch = a.toLowerCase().includes(lowerSearchQuery);
            const bMatch = b.toLowerCase().includes(lowerSearchQuery);
            
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
          });
          
          // Capitalize first letter of each keyword
          keywordsList = sortedKeywords
            .map(keyword => keyword.charAt(0).toUpperCase() + keyword.slice(1))
            .join(", ");
        }
        
        return { label: "Keywords", value: keywordsList };
      default:
        return { label: "Genre", value: game.genres || "Unknown Genre" };
    }
  };
  
  // Helper function to highlight matching text
  const highlightMatch = (text, query) => {
    if (category === "all" || category === "games" || !query || !text) return text;
    
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    
    return (
      <>
        {before}
        <span className="text-primary font-semibold">{match}</span>
        {after}
      </>
    );
  };
  
  const previewResults = results.slice(0, 6);

  const handleViewMore = () => {
    navigate(`/search?query=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(category)}`);
    onSelect(null);
  };

  return (
    <div className="w-full bg-[#1a1b1e] rounded-xl shadow-lg border border-gray-800/50 overflow-hidden">
      {previewResults.map((game, index) => {
        const categoryInfo = getCategoryInfo(game);
        const isSelected = index === selectedIndex;
        
        return (
          <Link
            key={game.id}
            to={`/game/${game.slug || game.igdb_id}`}
            className={`flex items-center gap-4 p-3 transition-colors duration-200 ${
              isSelected 
                ? 'bg-gray-800 outline-none'
                : 'hover:bg-gray-800/50'
            }`}
            onClick={() => onSelect(game)}
            onMouseEnter={() => setSelectedIndex(index)}
            aria-selected={isSelected}
          >
            {/* Game Cover */}
            <div className="w-10 h-14 rounded-md overflow-hidden flex-shrink-0 bg-gray-800">
              <img
                src={game.cover_image || game.coverImage}
                alt={game.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  if (game.screenshots && game.screenshots.length > 0) {
                    e.target.src = game.screenshots[0];
                  }
                }}
              />
            </div>
            
            {/* Game Info */}
            <div className="flex-grow min-w-0">
              <h4 className="text-sm font-bold text-gray-100 truncate">
                {highlightMatch(game.name, searchQuery)}
              </h4>
              <div className="flex items-center gap-1 mt-0.5">
                {game.rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-primary text-xs">★</span>
                    <span className="text-xs text-gray-400">{formatRating(game.rating)}</span>
                  </div>
                )}
                <span className="text-xs text-gray-600">•</span>
                <p className="text-xs text-gray-400 truncate">
                  {category !== "all" && category !== "games" && <span className="text-gray-500">{categoryInfo.label}: </span>}
                  {typeof categoryInfo.value === 'string' ? highlightMatch(categoryInfo.value, searchQuery) : categoryInfo.value}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
      
      {/* View More Button */}
      <div className="w-full bg-[#1a1b1e] border-t border-gray-800/50 p-2 flex justify-center">
        <button 
          onClick={handleViewMore}
          onMouseEnter={() => setSelectedIndex(results.length)}
          className={`w-full mx-3 py-1.5 rounded text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center ${
            selectedIndex === results.length
              ? 'bg-gray-800 text-white outline-none'
              : 'bg-surface-dark hover:bg-surface/60 text-primary hover:text-primary/90'
          }`}
          aria-selected={selectedIndex === results.length}
        >
          {results.length > 6 ? `View all ${results.length} results` : "View more results"}
          <ChevronRight size={14} className="ml-1.5" />
        </button>
      </div>
    </div>
  );
};

export default SearchResults; 