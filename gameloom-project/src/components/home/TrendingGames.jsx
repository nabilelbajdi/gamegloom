import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameGrid from "../common/GameGrid";

const TrendingGames = () => {
  const { trendingGames, fetchTrendingGames } = useGameStore();

  useEffect(() => {
    fetchTrendingGames();
  }, []);

  return (
    <GameGrid
      title="Trending Games"
      viewAllLink="/discover"
      games={trendingGames}
      loading={trendingGames.length === 0}
    />
  );
};

export default TrendingGames;
