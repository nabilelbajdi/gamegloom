// src/components/home/HighlyRatedGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameSection from "./GameSection";

const HighlyRatedGames = () => {
  const { highlyRatedGames, fetchHighlyRatedGames } = useGameStore();

  useEffect(() => {
    fetchHighlyRatedGames();
  }, []);

  return (
    <GameSection
      title="Highly Rated Games"
      viewAllLink="/discover"
      games={highlyRatedGames}
      fetchGames={fetchHighlyRatedGames}
    />
  );
};

export default HighlyRatedGames;
