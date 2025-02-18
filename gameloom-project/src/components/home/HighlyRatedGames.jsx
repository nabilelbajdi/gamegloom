// src/components/home/HighlyRatedGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameCarousel from "../common/GameCarousel";

const HighlyRatedGames = () => {
  const { highlyRatedGames, fetchGames } = useGameStore();

  useEffect(() => {
    fetchGames("highlyRated");
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
