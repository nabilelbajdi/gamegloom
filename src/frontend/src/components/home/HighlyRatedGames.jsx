// src/components/home/HighlyRatedGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameCarousel from "../common/GameCarousel";

const HighlyRatedGames = () => {
  const { highlyRatedGames, fetchGames, categoryStatus } = useGameStore();

  useEffect(() => {
    fetchGames("highlyRated");
  }, []);

  return (
    <GameCarousel
      title="Highly Rated Games"
      viewAllLink="/discover/highly-rated"
      games={highlyRatedGames}
      maxGames={24}
      slidesToShow={6}
      status={categoryStatus["highlyRated"]}
      onRetry={() => fetchGames("highlyRated")}
    />
  );
};

export default HighlyRatedGames;
