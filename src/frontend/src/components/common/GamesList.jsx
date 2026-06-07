import React from "react";
import GameListCard from "./GameListCard";
import { ListSkeleton } from "./Skeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

const GamesList = ({ games, loading, status = null, onRetry = null }) => {
  const isLoading = status === "loading" || loading === true;

  if (isLoading) {
    return <ListSkeleton count={8} />;
  }

  if (status === "error") {
    return <ErrorState message="Couldn't load games." onRetry={onRetry} />;
  }

  if (games.length === 0) {
    return (
      <EmptyState
        title="No games found"
        message="We couldn't find any games matching your criteria."
        action={{ label: "Browse Games", to: "/games" }}
      />
    );
  }

  return (
    <div className="overflow-hidden">
      {games.map((game, index) => (
        <div key={game.id} className="border-b border-gray-700/20 last:border-b-0 py-2">
          <GameListCard game={game} index={index} />
        </div>
      ))}
    </div>
  );
};

export default GamesList;
