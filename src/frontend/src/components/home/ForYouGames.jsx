// src/components/home/ForYouGames.jsx
import React, { useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import { useAuth } from "../../context/AuthContext";
import GameCarousel from "../common/GameCarousel";

const ForYouGames = () => {
  const { user } = useAuth();
  const { recommendedGames, fetchGames, categoryStatus } = useGameStore();

  useEffect(() => {
    if (user) {
      fetchGames("recommendations");
    }
  }, [user]);

  if (!user) return null;

  return (
    <GameCarousel
      title="For You"
      games={recommendedGames}
      maxGames={24}
      slidesToShow={6}
      status={categoryStatus["recommendations"]}
      onRetry={() => fetchGames("recommendations")}
    />
  );
};

export default ForYouGames;
