// src/components/home/AnticipatedGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameGrid from "../common/GameGrid";

const AnticipatedGames = () => {
  const { anticipatedGames, fetchAnticipatedGames } = useGameStore();

  useEffect(() => {
    fetchAnticipatedGames();
  }, []);

  return (
    <GameGrid
      title="Most Anticipated Games"
      viewAllLink="/discover"
      games={anticipatedGames}
      loading={anticipatedGames.length === 0}
    />
  );
};

export default AnticipatedGames;
