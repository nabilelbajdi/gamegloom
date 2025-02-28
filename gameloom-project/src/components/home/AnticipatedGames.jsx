// src/components/home/AnticipatedGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameCarousel from "../common/GameCarousel";

const AnticipatedGames = () => {
  const { anticipatedGames, fetchGames } = useGameStore();

  useEffect(() => {
    fetchGames("anticipated");
  }, []);

  return (
    <GameCarousel
      title="Most Anticipated Games"
      viewAllLink="/discover"
      games={anticipatedGames}
      maxGames={20}
      slidesToShow={5}
    />
  );
};

export default AnticipatedGames;
