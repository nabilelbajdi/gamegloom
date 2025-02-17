// src/components/home/TrendingGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameSection from "./GameSection";

const TrendingGames = () => {
  const { trendingGames, fetchTrendingGames } = useGameStore();

  useEffect(() => {
    fetchTrendingGames();
  }, []);

  return (
    <GameSection
      title="Trending Games"
      viewAllLink="/discover"
      games={trendingGames}
      fetchGames={fetchTrendingGames}
    />
  );
};

export default TrendingGames;
