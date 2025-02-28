// src/components/home/LatestGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameCarousel from "../common/GameCarousel";

const LatestGames = () => {
  const { latestGames, fetchGames } = useGameStore();

  useEffect(() => {
    fetchGames("latest");
  }, []);

  return (
    <GameCarousel
      title="Latest Games"
      viewAllLink="/discover"
      games={latestGames}
      maxGames={10}
      slidesToShow={5}
    />
  );
};

export default LatestGames;
