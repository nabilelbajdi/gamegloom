// src/components/home/AnticipatedGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameSection from "./GameSection";

const AnticipatedGames = () => {
  const { anticipatedGames, fetchAnticipatedGames } = useGameStore();

  useEffect(() => {
    fetchAnticipatedGames();
  }, []);

  return (
    <GameSection
      title="Most Anticipated Games"
      viewAllLink="/discover"
      games={anticipatedGames}
      fetchGames={fetchAnticipatedGames}
    />
  );
};

export default AnticipatedGames;
