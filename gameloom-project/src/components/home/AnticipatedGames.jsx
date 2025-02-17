// src/components/home/AnticipatedGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameCarousel from "../common/GameCarousel";

const AnticipatedGames = () => {
  const { anticipatedGames, fetchAnticipatedGames } = useGameStore();

  useEffect(() => {
    fetchAnticipatedGames();
  }, []);

  return (
    <GameCarousel
      title="Most Anticipated Games"
      viewAllLink="/discover"
      games={anticipatedGames}
      maxGames={12}
      slidesToShow={6}
    />
  );
};

export default AnticipatedGames;
