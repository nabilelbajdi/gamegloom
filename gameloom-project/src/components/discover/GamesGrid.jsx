import React from "react";
import GameCard from "../../components/game/GameCard";

const GamesGrid = ({
  games,
  loading
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[...Array(12)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-[3/4] bg-surface-dark rounded-md"></div>
            <div className="h-4 bg-surface-dark rounded mt-2 w-3/4"></div>
            <div className="h-3 bg-surface-dark rounded mt-1 w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  // No results state
  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-xl font-semibold text-light mb-2">No games found</h3>
        <p className="text-light/70 max-w-md mb-6">
          We couldn't find any games in this category.
        </p>
      </div>
    );
  }

  // Games grid
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {games.map((game) => (
        <div key={game.id}>
          <GameCard game={game} />
        </div>
      ))}
    </div>
  );
};

export default GamesGrid; 