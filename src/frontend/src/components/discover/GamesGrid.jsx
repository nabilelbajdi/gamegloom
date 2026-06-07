import React from "react";
import GridGameCard from "../../components/game/GridGameCard";
import { CardGridSkeleton } from "../common/Skeleton";
import EmptyState from "../common/EmptyState";
import ErrorState from "../common/ErrorState";

const GamesGrid = ({ games, loading, status = null, onRetry = null }) => {
  const isLoading = status === "loading" || loading === true;

  if (isLoading) {
    return <CardGridSkeleton count={12} />;
  }

  if (status === "error") {
    return <ErrorState message="Couldn't load games." onRetry={onRetry} />;
  }

  if (games.length === 0) {
    return (
      <EmptyState
        title="No games found"
        message="We couldn't find any games matching your criteria."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {games.map((game) => (
        <GridGameCard key={game.id} game={game} />
      ))}
    </div>
  );
};

export default GamesGrid;
