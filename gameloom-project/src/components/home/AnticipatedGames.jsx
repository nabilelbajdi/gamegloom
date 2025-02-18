// src/components/home/AnticipatedGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameCarousel from "../common/GameCarousel";

const AnticipatedGames = () => {
  const { anticipatedGames, fetchGames } = useGameStore(); // ✅ Use new fetch function

  useEffect(() => {
    fetchGames("anticipated"); // ✅ Updated function call
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
