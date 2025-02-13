import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameGrid from "../common/GameGrid";

const HighlyRatedGames = () => {
  const { highlyRatedGames, fetchHighlyRatedGames } = useGameStore();

  useEffect(() => {
    fetchHighlyRatedGames();
  }, []);

  return (
    <GameGrid
      title="Highly Rated Games"
      viewAllLink="/discover"
      games={highlyRatedGames}
      loading={highlyRatedGames.length === 0}
    />
  );
};

export default HighlyRatedGames;
