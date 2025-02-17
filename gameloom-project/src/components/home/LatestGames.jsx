// src/components/home/LatestGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameSection from "./GameSection";

const LatestGames = () => {
  const { latestGames, fetchLatestGames } = useGameStore();

  useEffect(() => {
    fetchLatestGames();
  }, []);

  return (
    <GameSection
      title="Latest Releases"
      viewAllLink="/discover"
      games={latestGames}
      fetchGames={fetchLatestGames}
    />
  );
};

export default LatestGames;
