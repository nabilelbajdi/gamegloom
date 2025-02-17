// src/components/home/TrendingGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameCarousel from "../common/GameCarousel";

const TrendingGames = () => {
  const { trendingGames, fetchTrendingGames } = useGameStore();

  useEffect(() => {
    fetchTrendingGames();
  }, []);

  return (
    <GameCarousel
      title="Trending Games"
      viewAllLink="/discover"
      games={trendingGames}
      maxGames={12}
      slidesToShow={6}
    />
  );
};

export default TrendingGames;
