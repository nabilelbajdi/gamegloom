// src/components/home/HighlyRatedGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameCarousel from "../common/GameCarousel";

const HighlyRatedGames = () => {
  const { highlyRatedGames, fetchHighlyRatedGames } = useGameStore();

  useEffect(() => {
    fetchHighlyRatedGames();
  }, []);

  return (
    <GameCarousel
      title="Highly Rated Games"
      viewAllLink="/discover"
      games={highlyRatedGames}
      maxGames={12}
      slidesToShow={6}
    />
  );
};

export default HighlyRatedGames;
