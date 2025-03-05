import React, { useState, useRef, useEffect } from "react";
import { Filter, Check, ChevronDown, Gamepad2, Tags, X, Star } from "lucide-react";

const FilterModal = ({
  allGenres,
  allThemes,
  activeGenres,
  activeThemes,
  minRating = 0,
  onFilterChange,
  isOpen,
  onClose
}) => {
  const [genresExpanded, setGenresExpanded] = useState(true);
  const [themesExpanded, setThemesExpanded] = useState(true);
  const [ratingExpanded, setRatingExpanded] = useState(true);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showAllThemes, setShowAllThemes] = useState(false);
  const [rating, setRating] = useState(minRating);
  const modalRef = useRef(null);

  // Handle escape key press
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      // Prevent body from scrolling when modal is open
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // Reset show all states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowAllGenres(false);
      setShowAllThemes(false);
    }
  }, [isOpen]);

  // Sync the rating with the prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(minRating);
    }
  }, [isOpen, minRating]);

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

  // Get visible genres - either all or just first 9
  const visibleGenres = showAllGenres ? allGenres : allGenres.slice(0, 9);
  const hasMoreGenres = allGenres.length > 9;

  // Get visible themes - either all or just first 9
  const visibleThemes = showAllThemes ? allThemes : allThemes.slice(0, 9);
  const hasMoreThemes = allThemes.length > 9;

  if (!isOpen) return null;
  
  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div 
        className="fixed top-[55%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] max-h-[80vh] bg-surface-dark rounded-lg shadow-xl z-50 flex flex-col popup-animation"
        ref={modalRef}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-800 p-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-white">Filters</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-surface hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto">
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
                <div className="grid grid-cols-3 gap-x-2 gap-y-2.5">
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
                <div className="grid grid-cols-3 gap-x-2 gap-y-2.5">
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
        
        {/* Modal Footer */}
        <div className="border-t border-gray-800 flex justify-between p-3">
          <button 
            onClick={resetFilters}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors font-semibold cursor-pointer"
          >
            Reset All
          </button>
          
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-primary text-dark text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
};

const FilterDropdown = ({
  allGenres,
  allThemes,
  activeGenres,
  activeThemes,
  minRating = 0,
  onFilterChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const activeFiltersCount = activeGenres.length + activeThemes.length + (minRating > 0 ? 1 : 0);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-surface/30 text-gray-400 hover:text-white hover:bg-surface/50 transition-all"
      >
        <Filter className="w-3.5 h-3.5" />
        <span>Filter</span>
        {activeFiltersCount > 0 && (
          <span className="flex items-center justify-center bg-primary/20 text-primary w-4 h-4 rounded-full text-[10px] ml-1">
            {activeFiltersCount}
          </span>
        )}
      </button>

      <FilterModal
        allGenres={allGenres}
        allThemes={allThemes}
        activeGenres={activeGenres}
        activeThemes={activeThemes}
        minRating={minRating}
        onFilterChange={onFilterChange}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default FilterDropdown; 