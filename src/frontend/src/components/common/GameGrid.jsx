// src/components/common/GameGrid.jsx
import React from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import GridGameCard from "../game/GridGameCard";

const GameGrid = ({
  title,
  viewAllLink,
  games,
  loading,
  emptyContent,
  columnCount = { default: 2, sm: 3, md: 4, lg: 5, xl: 6 },
  showResultCount = false,
  showStatus = false,
  collection = null,
  searchQuery = "",
  isSearching = false,
  onClearSearch = null,
  resultCountClassName = "text-gray-400",
  containerClassName = "container mx-auto px-4 py-8",
  gridClassName = "",
  hideRibbon = false
}) => {

  // Empty Search State
  const renderEmptySearchState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-light mb-2">No games found</h3>
      <p className="text-gray-400 max-w-md mb-4">
        {searchQuery
          ? `No games match your search for "${searchQuery}"`
          : "No games found in this category"}
      </p>
      {searchQuery && onClearSearch && (
        <button
          onClick={onClearSearch}
          className="text-primary hover:underline"
        >
          Clear search
        </button>
      )}
      {!searchQuery && (
        <Link
          to="/games"
          className="mt-4 px-5 py-2.5 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg transition-colors"
        >
          Browse Games
        </Link>
      )}
    </div>
  );

  return (
    <section className={containerClassName}>
      {title && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-light">{title}</h2>
          {viewAllLink && (
            <a href={viewAllLink} className="text-secondary text-sm hover:underline hover:text-primary flex items-center">
              View All <ChevronRight className="ml-1 w-4 h-4" />
            </a>
          )}
        </div>
      )}

      {/* Results count display */}
      {showResultCount && games.length > 0 && (
        <div className={`mb-6 ${resultCountClassName}`}>
          <span className="font-medium text-light">{games.length}</span> {games.length === 1 ? 'game' : 'games'}
          {searchQuery && <span> matching "<span className="text-primary">{searchQuery}</span>"</span>}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="aspect-[3/4] bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : games.length === 0 ? (
        isSearching ? renderEmptySearchState() : emptyContent
      ) : (
        <div className={`grid grid-cols-${columnCount.default} sm:grid-cols-${columnCount.sm} md:grid-cols-${columnCount.md} lg:grid-cols-${columnCount.lg} xl:grid-cols-${columnCount.xl} gap-3 ${gridClassName}`}>
          {games.map((game) => (
            <GridGameCard key={game.id} game={game} hideRibbon={hideRibbon} />
          ))}
          {emptyContent}
        </div>
      )}
    </section>
  );
};

export default GameGrid;
