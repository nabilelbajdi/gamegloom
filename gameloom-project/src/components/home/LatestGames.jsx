// src/components/home/LatestGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameCarousel from "../common/GameCarousel";

const LatestGames = () => {
  const { latestGames, fetchLatestGames } = useGameStore();

  useEffect(() => {
    fetchLatestGames();
  }, []);

  return (
    <GameCarousel
      title="Latest Games"
      viewAllLink="/discover"
      games={latestGames}
      maxGames={12}
      slidesToShow={6}
    />
  );
};

export default LatestGames;
