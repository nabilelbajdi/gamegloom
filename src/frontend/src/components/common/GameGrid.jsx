// src/components/common/GameGrid.jsx
import React from "react";
import { ChevronRight } from "lucide-react";
import GridGameCard from "../game/GridGameCard";
import { CardGridSkeleton } from "./Skeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

const GameGrid = ({
  title,
  viewAllLink,
  games,
  loading,
  status = null,
  onRetry = null,
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
  const isLoading = status === "loading" || loading === true;
  const isError = status === "error";

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

      {showResultCount && games.length > 0 && (
        <div className={`mb-6 ${resultCountClassName}`}>
          <span className="font-medium text-light">{games.length}</span> {games.length === 1 ? 'game' : 'games'}
          {searchQuery && <span> matching "<span className="text-primary">{searchQuery}</span>"</span>}
        </div>
      )}

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : isError ? (
        <ErrorState message="Couldn't load games." onRetry={onRetry} />
      ) : games.length === 0 ? (
        isSearching ? (
          <EmptyState
            title="No games found"
            message={searchQuery ? `No games match your search for "${searchQuery}"` : "No games found in this category"}
            action={searchQuery && onClearSearch ? { label: "Clear search", onClick: onClearSearch } : { label: "Browse Games", to: "/games" }}
          />
        ) : (
          emptyContent
        )
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
