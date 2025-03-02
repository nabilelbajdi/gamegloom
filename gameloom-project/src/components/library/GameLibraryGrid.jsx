import React, { useMemo } from "react";
import { X, Gamepad2, Tags, Filter, Search, ListFilter } from "lucide-react";
import GameGrid from "../common/GameGrid";
import { EmptyLists, EmptyCard } from "./EmptyState";
import { getActiveGames, sortGames } from "./LibraryUtils";

const GameLibraryGrid = ({ 
  collection, 
  activeTab, 
  selectedList, 
  myLists, 
  searchQuery, 
  setSearchQuery, 
  sortOption, 
  setSortOption, 
  activeFilters, 
  removeFilter,
  resetFilters
}) => {
  // Check if any filters are active
  const hasActiveFilters = () => 
    activeFilters.platforms.length > 0 || 
    activeFilters.genres.length > 0 || 
    activeFilters.themes.length > 0;

  // Get filtered and sorted games list
  const activeGamesList = useMemo(() => {
    const filteredGames = getActiveGames(collection, activeTab, selectedList, myLists, searchQuery);
    return sortGames(filteredGames, sortOption);
  }, [activeTab, sortOption, searchQuery, activeFilters, collection, selectedList, myLists]);

  // Helper for rendering filter tags
  const renderFilterItem = (category, item, icon) => (
    <div key={`${category}-${item}`} className="inline-flex items-center gap-1.5 bg-surface-dark px-2.5 py-1 rounded-full text-xs font-medium">
      {icon}
      <span className="font-semibold">{item}</span>
      <X 
        className="w-3 h-3 cursor-pointer hover:text-primary transition-colors" 
        onClick={() => removeFilter(category, item)}
      />
    </div>
  );

  // Render empty lists state
  if (activeTab === "my_lists" && myLists.length === 0) {
    return <EmptyLists />;
  }

  return (
    <div className="mb-8">
      {/* Search Results Counter and Sort Filters */}
      {(searchQuery || sortOption !== "release_new") && (
        <div className="flex justify-between items-center mb-6">
          {searchQuery && (
            <div className="text-gray-300 text-base font-medium">
              {activeGamesList.length > 0 ? 
                `${activeGamesList.length} ${activeGamesList.length === 1 ? 'game' : 'games'} matching "${searchQuery}"` : 
                `No games found for "${searchQuery}"`
              }
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {sortOption !== "release_new" && (
              <div className="flex items-center gap-1 bg-surface/50 px-2 py-1 rounded-full text-xs">
                <ListFilter className="w-3 h-3 text-primary" />
                <span className="text-gray-300">
                  {sortOption === "name_asc" ? "A-Z" : 
                   sortOption === "name_desc" ? "Z-A" : 
                   sortOption === "rating_high" ? "Top Rated" :
                   sortOption === "rating_low" ? "Low Rated" :
                   sortOption === "release_old" ? "Oldest First" : ""}
                </span>
                <button 
                  onClick={() => setSortOption("release_new")}
                  className="ml-1 text-gray-500 hover:text-gray-300 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {searchQuery && (
              <div className="flex items-center gap-1 bg-surface/50 px-2 py-1 rounded-full text-xs">
                <Search className="w-3 h-3 text-primary" />
                <span className="text-gray-300 max-w-[150px] truncate">{searchQuery}</span>
                <button 
                  onClick={() => setSearchQuery("")}
                  className="ml-1 text-gray-500 hover:text-gray-300 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Active Filter Tags */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap gap-2 pb-4">
          {activeFilters.platforms.map(platform => 
            renderFilterItem('platforms', platform, <Gamepad2 className="w-3 h-3 text-primary" />)
          )}
          {activeFilters.genres.map(genre => 
            renderFilterItem('genres', genre, <Tags className="w-3 h-3 text-primary" />)
          )}
          {activeFilters.themes.map(theme => 
            renderFilterItem('themes', theme, <Filter className="w-3 h-3 text-primary" />)
          )}
          <button 
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 hover:border-primary hover:text-primary px-2.5 py-1 rounded-full text-xs font-semibold text-gray-400 hover:text-primary transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
      
      {/* Game Grid */}
      <GameGrid 
        games={activeGamesList}
        loading={false}
        emptyContent={activeTab === "all" ? <EmptyCard /> : null}
        collection={collection}
        searchQuery={searchQuery}
        isSearching={!!searchQuery}
        onClearSearch={() => setSearchQuery("")}
        showResultCount={false}
        containerClassName="container mx-auto"
        columnCount={{ default: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
      />
    </div>
  );
};

export default GameLibraryGrid; 