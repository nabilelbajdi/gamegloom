import React, { useState, useEffect } from "react";
import { Filter, Check, ChevronDown, Gamepad2, Tags, Star, Monitor, Users, Eye, Search, X, BookCopy } from "lucide-react";

const FilterPanel = ({
  allGenres = [],
  allThemes = [],
  allPlatforms = [],
  allGameModes = [],
  allPlayerPerspectives = [],
  allContentTypes = [],
  activeGenres = [],
  activeThemes = [],
  activePlatforms = [],
  activeGameModes = [],
  activePlayerPerspectives = [],
  activeContentTypes = [],
  minRating = 0,
  titleFilter = "",
  onFilterChange,
  onTitleFilterChange
}) => {
  const [genresExpanded, setGenresExpanded] = useState(true);
  const [themesExpanded, setThemesExpanded] = useState(true);
  const [platformsExpanded, setPlatformsExpanded] = useState(true);
  const [gameModesExpanded, setGameModesExpanded] = useState(true);
  const [perspectivesExpanded, setPerspectivesExpanded] = useState(true);
  const [contentTypesExpanded, setContentTypesExpanded] = useState(true);
  const [ratingExpanded, setRatingExpanded] = useState(true);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showAllThemes, setShowAllThemes] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [showAllGameModes, setShowAllGameModes] = useState(false);
  const [showAllPerspectives, setShowAllPerspectives] = useState(false);
  const [showAllContentTypes, setShowAllContentTypes] = useState(false);
  const [rating, setRating] = useState(minRating);

  const scrollToTop = () => {
    setTimeout(() => {
      const scrollStep = -window.scrollY / 15;
      const scrollInterval = setInterval(() => {
        if (window.scrollY !== 0) {
          window.scrollBy(0, scrollStep);
        } else {
          clearInterval(scrollInterval);
        }
      }, 15);
    }, 50);
  };

  const toggleFilter = (type, value) => {
    if (type === "genre") {
      const updatedGenres = activeGenres.includes(value)
        ? activeGenres.filter((item) => item !== value)
        : [...activeGenres, value];

      onFilterChange({
        genres: updatedGenres,
        themes: activeThemes,
        platforms: activePlatforms,
        gameModes: activeGameModes,
        playerPerspectives: activePlayerPerspectives,
        contentTypes: activeContentTypes,
        minRating: rating
      });
      scrollToTop();
    } else if (type === "theme") {
      const updatedThemes = activeThemes.includes(value)
        ? activeThemes.filter((item) => item !== value)
        : [...activeThemes, value];
      
      onFilterChange({
        genres: activeGenres,
        themes: updatedThemes,
        platforms: activePlatforms,
        gameModes: activeGameModes,
        playerPerspectives: activePlayerPerspectives,
        contentTypes: activeContentTypes,
        minRating: rating
      });
      scrollToTop();
    } else if (type === "platform") {
      const updatedPlatforms = activePlatforms.includes(value)
        ? activePlatforms.filter((item) => item !== value)
        : [...activePlatforms, value];
      
      onFilterChange({
        genres: activeGenres,
        themes: activeThemes,
        platforms: updatedPlatforms,
        gameModes: activeGameModes,
        playerPerspectives: activePlayerPerspectives,
        contentTypes: activeContentTypes,
        minRating: rating
      });
      scrollToTop();
    } else if (type === "gameMode") {
      const updatedGameModes = activeGameModes.includes(value)
        ? activeGameModes.filter((item) => item !== value)
        : [...activeGameModes, value];
      
      onFilterChange({
        genres: activeGenres,
        themes: activeThemes,
        platforms: activePlatforms,
        gameModes: updatedGameModes,
        playerPerspectives: activePlayerPerspectives,
        contentTypes: activeContentTypes,
        minRating: rating
      });
      scrollToTop();
    } else if (type === "perspective") {
      const updatedPerspectives = activePlayerPerspectives.includes(value)
        ? activePlayerPerspectives.filter((item) => item !== value)
        : [...activePlayerPerspectives, value];
      
      onFilterChange({
        genres: activeGenres,
        themes: activeThemes,
        platforms: activePlatforms,
        gameModes: activeGameModes,
        playerPerspectives: updatedPerspectives,
        contentTypes: activeContentTypes,
        minRating: rating
      });
      scrollToTop();
    } else if (type === "contentType") {
      const updatedContentTypes = activeContentTypes.includes(value)
        ? activeContentTypes.filter((item) => item !== value)
        : [...activeContentTypes, value];
      
      onFilterChange({
        genres: activeGenres,
        themes: activeThemes,
        platforms: activePlatforms,
        gameModes: activeGameModes,
        playerPerspectives: activePlayerPerspectives,
        contentTypes: updatedContentTypes,
        minRating: rating
      });
      scrollToTop();
    }
  };

  const handleRatingChange = (e) => {
    const newRating = parseFloat(e.target.value);
    setRating(newRating);
    
    onFilterChange({
      genres: activeGenres,
      themes: activeThemes,
      platforms: activePlatforms,
      gameModes: activeGameModes,
      playerPerspectives: activePlayerPerspectives,
      contentTypes: activeContentTypes,
      minRating: newRating
    });
    scrollToTop();
  };

  const resetFilters = () => {
    setRating(0);
    onFilterChange({
      genres: [],
      themes: [],
      platforms: [],
      gameModes: [],
      playerPerspectives: [],
      contentTypes: [],
      minRating: 0
    });
  };

  const toggleGenresSection = () => {
    setGenresExpanded(!genresExpanded);
  };

  const toggleThemesSection = () => {
    setThemesExpanded(!themesExpanded);
  };

  const togglePlatformsSection = () => {
    setPlatformsExpanded(!platformsExpanded);
  };

  const toggleGameModesSection = () => {
    setGameModesExpanded(!gameModesExpanded);
  };

  const togglePerspectivesSection = () => {
    setPerspectivesExpanded(!perspectivesExpanded);
  };

  const toggleContentTypesSection = () => {
    setContentTypesExpanded(!contentTypesExpanded);
  };

  const toggleRatingSection = () => {
    setRatingExpanded(!ratingExpanded);
  };

  const visibleGenres = showAllGenres ? allGenres : allGenres.slice(0, 9);
  const hasMoreGenres = allGenres.length > 9;

  const visibleThemes = showAllThemes ? allThemes : allThemes.slice(0, 9);
  const hasMoreThemes = allThemes.length > 9;

  const visiblePlatforms = showAllPlatforms ? allPlatforms : allPlatforms.slice(0, 9);
  const hasMorePlatforms = allPlatforms.length > 9;

  const visibleGameModes = showAllGameModes ? allGameModes : allGameModes.slice(0, 9);
  const hasMoreGameModes = allGameModes.length > 9;

  const visiblePerspectives = showAllPerspectives ? allPlayerPerspectives : allPlayerPerspectives.slice(0, 9);
  const hasMorePerspectives = allPlayerPerspectives.length > 9;

  const visibleContentTypes = showAllContentTypes ? allContentTypes : allContentTypes.slice(0, 9);
  const hasMoreContentTypes = allContentTypes.length > 9;

  return (
    <div className="bg-surface-dark/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-800/30 overflow-hidden sticky top-20">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-gray-800 p-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-white">Filters</h3>
        </div>
      </div>
      
      {/* Panel Body */}
      <div className="overflow-y-auto scrollbar-hide max-h-[calc(100vh-180px)]">
        {/* Title Filter */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-800/50">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
              <Search size={14} className="text-primary" />
            </div>
            <input
              type="text"
              value={titleFilter}
              onChange={(e) => onTitleFilterChange(e.target.value)}
              placeholder="Filter by title..."
              className="w-full bg-surface-dark text-sm text-white rounded-md pl-8 pr-8 py-2 focus:outline-none border-none shadow-sm"
            />
            {titleFilter && (
              <button
                onClick={() => onTitleFilterChange("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Minimum Rating Section */}
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
            <div className="px-4 pb-4">
              <div className="mt-1">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={rating}
                  onChange={handleRatingChange}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                
                <div className="flex justify-between mt-2 items-center">
                  <span className="text-xs text-gray-400">0</span>
                  <div className="rounded-md bg-surface-dark py-1.5 px-3 shadow-sm border-none">
                    <div className="flex items-center gap-1.5">
                      <Star className={`w-3.5 h-3.5 ${rating > 0 ? "text-primary" : "text-gray-500"}`} fill={rating > 0 ? "currentColor" : "none"} />
                      <span className={`text-xs font-semibold ${rating > 0 ? "text-white" : "text-gray-500"}`}>
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">5</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Type Section */}
        {allContentTypes.length > 0 && (
          <div className="border-b border-gray-800/50">
            <div 
              className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-surface/30 transition-colors" 
              onClick={toggleContentTypesSection}
            >
              <div className="flex items-center gap-2.5">
                <BookCopy className="w-4 h-4 text-gray-400" />
                <h4 className="text-xs font-semibold text-white">Content Type</h4>
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-gray-400 transition-transform ${contentTypesExpanded ? 'rotate-180' : ''}`} 
              />
            </div>
            
            {contentTypesExpanded && (
              <div className="px-4 py-3">
                <div className="grid grid-cols-1 gap-y-2.5">
                  {visibleContentTypes.map((contentType) => (
                    <button
                      key={contentType}
                      onClick={() => toggleFilter('contentType', contentType)}
                      className="flex items-center text-xs hover:text-white transition-all py-0.5 cursor-pointer"
                    >
                      <div 
                        className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mr-2 flex items-center justify-center
                          ${activeContentTypes.includes(contentType) 
                            ? 'bg-primary border-0' 
                            : 'border border-gray-600 bg-transparent'
                          }`}
                      >
                        {activeContentTypes.includes(contentType) && (
                          <Check className="w-2 h-2 text-dark" />
                        )}
                      </div>
                      <span className={`truncate font-semibold ${activeContentTypes.includes(contentType) ? 'text-primary' : 'text-gray-400'}`}>
                        {contentType}
                      </span>
                    </button>
                  ))}
                </div>
                
                {hasMoreContentTypes && (
                  <button 
                    onClick={() => setShowAllContentTypes(!showAllContentTypes)}
                    className="mt-3 text-xs text-primary/80 hover:text-primary font-semibold flex items-center cursor-pointer"
                  >
                    {showAllContentTypes ? 'Show Less' : `Show All (${allContentTypes.length})`}
                    <ChevronDown 
                      className={`w-3.5 h-3.5 ml-1.5 ${showAllContentTypes ? 'rotate-180' : ''} transition-transform`} 
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Platforms Section */}
        {allPlatforms.length > 0 && (
          <div className="border-b border-gray-800/50">
            <div 
              className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-surface/30 transition-colors" 
              onClick={togglePlatformsSection}
            >
              <div className="flex items-center gap-2.5">
                <Monitor className="w-4 h-4 text-gray-400" />
                <h4 className="text-xs font-semibold text-white">Platforms</h4>
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-gray-400 transition-transform ${platformsExpanded ? 'rotate-180' : ''}`} 
              />
            </div>
            
            {platformsExpanded && (
              <div className="px-4 py-3">
                <div className="grid grid-cols-1 gap-y-2.5">
                  {visiblePlatforms.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => toggleFilter('platform', platform)}
                      className="flex items-center text-xs hover:text-white transition-all py-0.5 cursor-pointer"
                    >
                      <div 
                        className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mr-2 flex items-center justify-center
                          ${activePlatforms.includes(platform) 
                            ? 'bg-primary border-0' 
                            : 'border border-gray-600 bg-transparent'
                          }`}
                      >
                        {activePlatforms.includes(platform) && (
                          <Check className="w-2 h-2 text-dark" />
                        )}
                      </div>
                      <span className={`truncate font-semibold ${activePlatforms.includes(platform) ? 'text-primary' : 'text-gray-400'}`}>
                        {platform}
                      </span>
                    </button>
                  ))}
                </div>
                
                {hasMorePlatforms && (
                  <button 
                    onClick={() => setShowAllPlatforms(!showAllPlatforms)}
                    className="mt-3 text-xs text-primary/80 hover:text-primary font-semibold flex items-center cursor-pointer"
                  >
                    {showAllPlatforms ? 'Show Less' : `Show All (${allPlatforms.length})`}
                    <ChevronDown 
                      className={`w-3.5 h-3.5 ml-1.5 ${showAllPlatforms ? 'rotate-180' : ''} transition-transform`} 
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Game Modes Section */}
        {allGameModes.length > 0 && (
          <div className="border-b border-gray-800/50">
            <div 
              className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-surface/30 transition-colors" 
              onClick={toggleGameModesSection}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-gray-400" />
                <h4 className="text-xs font-semibold text-white">Game Modes</h4>
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-gray-400 transition-transform ${gameModesExpanded ? 'rotate-180' : ''}`} 
              />
            </div>
            
            {gameModesExpanded && (
              <div className="px-4 py-3">
                <div className="grid grid-cols-1 gap-y-2.5">
                  {visibleGameModes.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => toggleFilter('gameMode', mode)}
                      className="flex items-center text-xs hover:text-white transition-all py-0.5 cursor-pointer"
                    >
                      <div 
                        className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mr-2 flex items-center justify-center
                          ${activeGameModes.includes(mode) 
                            ? 'bg-primary border-0' 
                            : 'border border-gray-600 bg-transparent'
                          }`}
                      >
                        {activeGameModes.includes(mode) && (
                          <Check className="w-2 h-2 text-dark" />
                        )}
                      </div>
                      <span className={`truncate font-semibold ${activeGameModes.includes(mode) ? 'text-primary' : 'text-gray-400'}`}>
                        {mode}
                      </span>
                    </button>
                  ))}
                </div>
                
                {hasMoreGameModes && (
                  <button 
                    onClick={() => setShowAllGameModes(!showAllGameModes)}
                    className="mt-3 text-xs text-primary/80 hover:text-primary font-semibold flex items-center cursor-pointer"
                  >
                    {showAllGameModes ? 'Show Less' : `Show All (${allGameModes.length})`}
                    <ChevronDown 
                      className={`w-3.5 h-3.5 ml-1.5 ${showAllGameModes ? 'rotate-180' : ''} transition-transform`} 
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Player Perspectives Section */}
        {allPlayerPerspectives.length > 0 && (
          <div className="border-b border-gray-800/50">
            <div 
              className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-surface/30 transition-colors" 
              onClick={togglePerspectivesSection}
            >
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-gray-400" />
                <h4 className="text-xs font-semibold text-white">Player Perspectives</h4>
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-gray-400 transition-transform ${perspectivesExpanded ? 'rotate-180' : ''}`} 
              />
            </div>
            
            {perspectivesExpanded && (
              <div className="px-4 py-3">
                <div className="grid grid-cols-1 gap-y-2.5">
                  {visiblePerspectives.map((perspective) => (
                    <button
                      key={perspective}
                      onClick={() => toggleFilter('perspective', perspective)}
                      className="flex items-center text-xs hover:text-white transition-all py-0.5 cursor-pointer"
                    >
                      <div 
                        className={`w-3.5 h-3.5 rounded-full flex-shrink-0 mr-2 flex items-center justify-center
                          ${activePlayerPerspectives.includes(perspective) 
                            ? 'bg-primary border-0' 
                            : 'border border-gray-600 bg-transparent'
                          }`}
                      >
                        {activePlayerPerspectives.includes(perspective) && (
                          <Check className="w-2 h-2 text-dark" />
                        )}
                      </div>
                      <span className={`truncate font-semibold ${activePlayerPerspectives.includes(perspective) ? 'text-primary' : 'text-gray-400'}`}>
                        {perspective}
                      </span>
                    </button>
                  ))}
                </div>
                
                {hasMorePerspectives && (
                  <button 
                    onClick={() => setShowAllPerspectives(!showAllPerspectives)}
                    className="mt-3 text-xs text-primary/80 hover:text-primary font-semibold flex items-center cursor-pointer"
                  >
                    {showAllPerspectives ? 'Show Less' : `Show All (${allPlayerPerspectives.length})`}
                    <ChevronDown 
                      className={`w-3.5 h-3.5 ml-1.5 ${showAllPerspectives ? 'rotate-180' : ''} transition-transform`} 
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

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