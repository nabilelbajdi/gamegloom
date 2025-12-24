import React from "react";
import GameListCard from "./GameListCard";

const GamesList = ({
  games,
  loading
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="overflow-hidden">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="flex items-stretch animate-pulse border-b border-gray-700/20 last:border-b-0 py-2">
            {/* Cover Skeleton */}
            <div className="w-16 md:w-20 aspect-[3/4] bg-gray-800/50 rounded"></div>

            {/* Content Skeleton */}
            <div className="flex-1 p-3">
              <div className="h-4 bg-gray-800/60 rounded w-1/3 mb-3"></div>
              <div className="flex gap-1.5">
                <div className="h-3 bg-gray-800/60 rounded w-16"></div>
                <div className="h-3 bg-gray-800/60 rounded w-16"></div>
              </div>
            </div>
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
          We couldn't find any games matching your criteria.
        </p>
      </div>
    );
  }

  // Games list
  return (
    <div className="overflow-hidden">
      {games.map((game, index) => (
        <div key={game.id} className="border-b border-gray-700/20 last:border-b-0 py-2">
          <GameListCard
            game={game}
            index={index}
          />
        </div>
      ))}
    </div>
  );
};

export default GamesList; 