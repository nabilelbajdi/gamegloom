import React from "react";
import { X, Gamepad2, Tags, Star, Monitor, Users, Eye, BookCopy } from "lucide-react";

const ActiveFilters = ({
  genreFilters = [],
  themeFilters = [],
  platformFilters = [],
  gameModeFilters = [],
  perspectiveFilters = [],
  contentTypeFilters = [],
  minRating = 0,
  onRemoveGenre,
  onRemoveTheme,
  onRemovePlatform,
  onRemoveGameMode,
  onRemovePerspective,
  onRemoveContentType,
  onRemoveRating,
  onClearAll
}) => {
  const hasActiveFilters = 
    genreFilters.length > 0 || 
    themeFilters.length > 0 || 
    platformFilters.length > 0 || 
    gameModeFilters.length > 0 || 
    perspectiveFilters.length > 0 || 
    contentTypeFilters.length > 0 ||
    minRating > 0;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="mt-3.5 flex flex-wrap gap-2">
      {genreFilters.map(genre => (
        <FilterTag 
          key={`genre-${genre}`} 
          label={genre} 
          icon={<Gamepad2 className="w-3 h-3" />}
          onRemove={() => onRemoveGenre(genre)} 
        />
      ))}
      
      {themeFilters.map(theme => (
        <FilterTag 
          key={`theme-${theme}`} 
          label={theme} 
          icon={<Tags className="w-3 h-3" />}
          onRemove={() => onRemoveTheme(theme)} 
        />
      ))}
      
      {platformFilters.map(platform => (
        <FilterTag 
          key={`platform-${platform}`} 
          label={platform} 
          icon={<Monitor className="w-3 h-3" />}
          onRemove={() => onRemovePlatform(platform)} 
        />
      ))}
      
      {gameModeFilters.map(mode => (
        <FilterTag 
          key={`mode-${mode}`} 
          label={mode} 
          icon={<Users className="w-3 h-3" />}
          onRemove={() => onRemoveGameMode(mode)} 
        />
      ))}
      
      {perspectiveFilters.map(perspective => (
        <FilterTag 
          key={`perspective-${perspective}`} 
          label={perspective} 
          icon={<Eye className="w-3 h-3" />}
          onRemove={() => onRemovePerspective(perspective)} 
        />
      ))}

      {contentTypeFilters.map(contentType => (
        <FilterTag 
          key={`contentType-${contentType}`} 
          label={contentType} 
          icon={<BookCopy className="w-3 h-3" />}
          onRemove={() => onRemoveContentType(contentType)} 
        />
      ))}
      
      {minRating > 0 && (
        <FilterTag 
          key="rating" 
          label={`Rating: ${minRating.toFixed(1)}+`} 
          icon={<Star className="w-3 h-3" />}
          onRemove={onRemoveRating} 
        />
      )}
      
      {hasActiveFilters && (
        <button 
          onClick={onClearAll}
          className="text-xs bg-gray-800/70 text-gray-300 hover:text-white py-1 px-2.5 rounded font-semibold hover:bg-gray-700/70 transition-colors flex items-center gap-1.5 ml-1"
        >
          Clear All
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

const FilterTag = ({ label, icon, onRemove }) => (
  <div className="flex items-center bg-primary/10 border border-primary/10 text-primary py-1 pl-2.5 pr-1.5 rounded-full text-xs font-semibold">
    <div className="flex items-center gap-1.5 truncate max-w-[120px]">
      {icon}
      <span className="truncate">{label}</span>
    </div>
    <button 
      onClick={onRemove}
      className="ml-1.5 rounded-full hover:bg-gray-800/30 w-4 h-4 flex items-center justify-center"
    >
      <X className="w-3 h-3" />
    </button>
  </div>
);

export default ActiveFilters; 