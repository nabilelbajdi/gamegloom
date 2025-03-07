import React, { useState } from "react";
import { Filter, Check, ChevronDown, Gamepad2, Tags, Star } from "lucide-react";

const FilterPanel = ({
  allGenres,
  allThemes,
  activeGenres,
  activeThemes,
  minRating = 0,
  onFilterChange
}) => {
  const [genresExpanded, setGenresExpanded] = useState(true);
  const [themesExpanded, setThemesExpanded] = useState(true);
  const [ratingExpanded, setRatingExpanded] = useState(true);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showAllThemes, setShowAllThemes] = useState(false);
  const [rating, setRating] = useState(minRating);

  const toggleFilter = (type, value) => {
    if (type === "genre") {
      const updatedGenres = activeGenres.includes(value)
        ? activeGenres.filter((item) => item !== value)
        : [...activeGenres, value];

      onFilterChange({
        genres: updatedGenres,
        themes: activeThemes,
        minRating: rating
      });
    } else if (type === "theme") {
      const updatedThemes = activeThemes.includes(value)
        ? activeThemes.filter((item) => item !== value)
        : [...activeThemes, value];
      
      onFilterChange({
        genres: activeGenres,
        themes: updatedThemes,
        minRating: rating
      });
    }
  };

  const handleRatingChange = (e) => {
    const newRating = parseFloat(e.target.value);
    setRating(newRating);
    
    onFilterChange({
      genres: activeGenres,
      themes: activeThemes,
      minRating: newRating
    });
  };

  const resetFilters = () => {
    setRating(0);
    onFilterChange({
      genres: [],
      themes: [],
      minRating: 0
    });
  };

  const toggleGenresSection = () => {
    setGenresExpanded(!genresExpanded);
  };

  const toggleThemesSection = () => {
    setThemesExpanded(!themesExpanded);
  };

  const toggleRatingSection = () => {
    setRatingExpanded(!ratingExpanded);
  };

  const visibleGenres = showAllGenres ? allGenres : allGenres.slice(0, 9);
  const hasMoreGenres = allGenres.length > 9;

  const visibleThemes = showAllThemes ? allThemes : allThemes.slice(0, 9);
  const hasMoreThemes = allThemes.length > 9;

  return (
    <div className="bg-surface-dark/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-800/30 overflow-hidden sticky top-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-gray-800 p-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-white">Filters</h3>
        </div>
        {(activeGenres.length > 0 || activeThemes.length > 0 || minRating > 0) && (
          <button 
            onClick={resetFilters}
            className="text-xs text-primary/80 hover:text-primary font-medium"
          >
            Reset
          </button>
        )}
      </div>
      
      {/* Panel Body */}
      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* Rating Section */}
        <div className="border-b border-gray-800/50">
          <div 
            className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-surface/30 transition-colors" 
            onClick={toggleRatingSection}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-gray-400" />
              <h4 className="text-xs font-semibold text-white">Minimum Rating</h4>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform ${ratingExpanded ? 'rotate-180' : ''}`} 
            />
          </div>
          
          {ratingExpanded && (
            <div className="px-4 py-3">
              <div className="flex items-center">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={rating}
                  onChange={handleRatingChange}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              <div className="flex justify-between mt-2 text-xs font-semibold">
                <span className="text-gray-400">0</span>
                <div className="flex items-center gap-1">
                  <Star className={`w-3.5 h-3.5 ${rating > 0 ? "text-primary" : "text-gray-400"}`} fill={rating > 0 ? "currentColor" : "none"} />
                  <span className={rating > 0 ? "text-primary" : "text-gray-400"}>
                    {rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-400">5</span>
              </div>
              {rating > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Showing games rated {rating.toFixed(1)} or higher
                </p>
              )}
            </div>
          )}
        </div>

        {/* Genres Section */}
        <div className="border-b border-gray-800/50">
          <div 
            className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-surface/30 transition-colors" 
            onClick={toggleGenresSection}
          >
            <div className="flex items-center gap-2.5">
              <Gamepad2 className="w-4 h-4 text-gray-400" />
              <h4 className="text-xs font-semibold text-white">Genres</h4>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform ${genresExpanded ? 'rotate-180' : ''}`} 
            />
          </div>
          
          {genresExpanded && (
            <div className="px-4 py-3">
              <div className="grid grid-cols-1 gap-y-2.5">
                {visibleGenres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleFilter('genre', genre)}
                    className="flex items-center text-xs hover:text-white transition-all py-0.5 cursor-pointer"
                  >
                    <div 
                      className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mr-2 flex items-center justify-center
                        ${activeGenres.includes(genre) 
                          ? 'bg-primary border-0' 
                          : 'border border-gray-600 bg-transparent'
                        }`}
                    >
                      {activeGenres.includes(genre) && (
                        <Check className="w-2 h-2 text-dark" />
                      )}
                    </div>
                    <span className={`truncate font-semibold ${activeGenres.includes(genre) ? 'text-primary' : 'text-gray-400'}`}>
                      {genre}
                    </span>
                  </button>
                ))}
              </div>
              
              {hasMoreGenres && (
                <button 
                  onClick={() => setShowAllGenres(!showAllGenres)}
                  className="mt-3 text-xs text-primary/80 hover:text-primary font-semibold flex items-center cursor-pointer"
                >
                  {showAllGenres ? 'Show Less' : `Show All (${allGenres.length})`}
                  <ChevronDown 
                    className={`w-3.5 h-3.5 ml-1.5 ${showAllGenres ? 'rotate-180' : ''} transition-transform`} 
                  />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Themes Section */}
        <div>
          <div 
            className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-surface/30 transition-colors" 
            onClick={toggleThemesSection}
          >
            <div className="flex items-center gap-2.5">
              <Tags className="w-4 h-4 text-gray-400" />
              <h4 className="text-xs font-semibold text-white">Themes</h4>
            </div>
            <ChevronDown 
              className={`w-4 h-4 text-gray-400 transition-transform ${themesExpanded ? 'rotate-180' : ''}`} 
            />
          </div>
          
          {themesExpanded && (
            <div className="px-4 py-3">
              <div className="grid grid-cols-1 gap-y-2.5">
                {visibleThemes.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => toggleFilter('theme', theme)}
                    className="flex items-center text-xs hover:text-white transition-all py-0.5 cursor-pointer"
                  >
                    <div 
                      className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mr-2 flex items-center justify-center
                        ${activeThemes.includes(theme) 
                          ? 'bg-primary border-0' 
                          : 'border border-gray-600 bg-transparent'
                        }`}
                    >
                      {activeThemes.includes(theme) && (
                        <Check className="w-2 h-2 text-dark" />
                      )}
                    </div>
                    <span className={`truncate font-semibold ${activeThemes.includes(theme) ? 'text-primary' : 'text-gray-400'}`}>
                      {theme}
                    </span>
                  </button>
                ))}
              </div>
              
              {hasMoreThemes && (
                <button 
                  onClick={() => setShowAllThemes(!showAllThemes)}
                  className="mt-3 text-xs text-primary/80 hover:text-primary font-semibold flex items-center cursor-pointer"
                >
                  {showAllThemes ? 'Show Less' : `Show All (${allThemes.length})`}
                  <ChevronDown 
                    className={`w-3.5 h-3.5 ml-1.5 ${showAllThemes ? 'rotate-180' : ''} transition-transform`} 
                  />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel; 