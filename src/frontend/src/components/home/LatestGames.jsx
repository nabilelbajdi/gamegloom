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
      viewAllLink="/discover/latest-releases"
      games={latestGames}
      maxGames={24}
      slidesToShow={6}
    />
  );
};

export default LatestGames;
