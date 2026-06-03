// src/components/home/AnticipatedGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import GameCarousel from "../common/GameCarousel";

const AnticipatedGames = () => {
  const { anticipatedGames, fetchGames, categoryStatus } = useGameStore();

  useEffect(() => {
    fetchGames("anticipated");
  }, [fetchGames]);

  return (
    <GameCarousel
      title="Anticipated Games"
      viewAllLink="/discover/anticipated"
      games={anticipatedGames}
      maxGames={24}
      slidesToShow={6}
      status={categoryStatus["anticipated"]}
      onRetry={() => fetchGames("anticipated")}
    />
  );
};

export default AnticipatedGames;
