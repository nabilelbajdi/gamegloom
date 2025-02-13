import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameGrid from "../common/GameGrid";

const LatestGames = () => {
  const { latestGames, fetchLatestGames } = useGameStore();

  useEffect(() => {
    fetchLatestGames();
  }, []);

  return (
    <GameGrid
      title="Latest Releases"
      viewAllLink="/discover"
      games={latestGames}
      loading={latestGames.length === 0}
    />
  );
};

export default LatestGames;
