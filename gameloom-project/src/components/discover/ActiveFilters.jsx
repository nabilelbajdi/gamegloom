import React from "react";
import { Star, X, Tags, Filter, Monitor, Users, Eye } from "lucide-react";

const ActiveFilters = ({
  genreFilters,
  themeFilters,
  platformFilters = [],
  gameModeFilters = [],
  perspectiveFilters = [],
  minRating = 0,
  onRemoveGenre,
  onRemoveTheme,
  onRemovePlatform,
  onRemoveGameMode,
  onRemovePerspective,
  onRemoveRating,
  onClearAll
}) => {
  const hasActiveFilters = genreFilters.length > 0 || themeFilters.length > 0 || 
                          platformFilters.length > 0 || gameModeFilters.length > 0 || 
                          perspectiveFilters.length > 0 || minRating > 0;
  
  if (!hasActiveFilters) {
    return null;
  }
  
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2 items-center">
        {platformFilters.map(platform => (
          <div key={platform} className="inline-flex items-center gap-1.5 bg-gray-800/40 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-700/20">
            <Monitor className="w-3 h-3 text-primary" />
            <span className="font-semibold text-gray-300">{platform}</span>
            <X 
              className="w-3 h-3 cursor-pointer hover:text-primary transition-colors" 
              onClick={() => onRemovePlatform(platform)}
            />
          </div>
        ))}

        {gameModeFilters.map(mode => (
          <div key={mode} className="inline-flex items-center gap-1.5 bg-gray-800/40 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-700/20">
            <Users className="w-3 h-3 text-primary" />
            <span className="font-semibold text-gray-300">{mode}</span>
            <X 
              className="w-3 h-3 cursor-pointer hover:text-primary transition-colors" 
              onClick={() => onRemoveGameMode(mode)}
            />
          </div>
        ))}

        {perspectiveFilters.map(perspective => (
          <div key={perspective} className="inline-flex items-center gap-1.5 bg-gray-800/40 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-700/20">
            <Eye className="w-3 h-3 text-primary" />
            <span className="font-semibold text-gray-300">{perspective}</span>
            <X 
              className="w-3 h-3 cursor-pointer hover:text-primary transition-colors" 
              onClick={() => onRemovePerspective(perspective)}
            />
          </div>
        ))}
        
        {genreFilters.map(genre => (
          <div key={genre} className="inline-flex items-center gap-1.5 bg-gray-800/40 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-700/20">
            <Tags className="w-3 h-3 text-primary" />
            <span className="font-semibold text-gray-300">{genre}</span>
            <X 
              className="w-3 h-3 cursor-pointer hover:text-primary transition-colors" 
              onClick={() => onRemoveGenre(genre)}
            />
          </div>
        ))}
        
        {themeFilters.map(theme => (
          <div key={theme} className="inline-flex items-center gap-1.5 bg-gray-800/40 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-700/20">
            <Filter className="w-3 h-3 text-primary" />
            <span className="font-semibold text-gray-300">{theme}</span>
            <X 
              className="w-3 h-3 cursor-pointer hover:text-primary transition-colors" 
              onClick={() => onRemoveTheme(theme)}
            />
          </div>
        ))}
        
        {minRating > 0 && (
          <div className="inline-flex items-center gap-1.5 bg-gray-800/40 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-700/20">
            <Star className="w-3 h-3 text-primary" fill="currentColor" />
            <span className="font-semibold text-gray-300">{minRating.toFixed(1)}+</span>
            <X 
              className="w-3 h-3 cursor-pointer hover:text-primary transition-colors" 
              onClick={onRemoveRating}
            />
          </div>
        )}
        
        {hasActiveFilters && (
          <button 
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 border border-gray-700/20 hover:border-primary hover:text-primary px-2.5 py-1 rounded-full text-xs font-semibold text-gray-400 transition-colors cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

export default ActiveFilters; 