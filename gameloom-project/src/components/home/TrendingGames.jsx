// src/components/home/TrendingGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameCarousel from "../common/GameCarousel";

const TrendingGames = () => {
  const { trendingGames, fetchGames } = useGameStore();

  useEffect(() => {
    fetchGames("trending");
  }, []);

  return (
    <GameCarousel
      title="Trending Games"
      viewAllLink="/discover/trending"
      games={trendingGames}
      maxGames={20}
      slidesToShow={5}
    />
  );
};

export default TrendingGames;
