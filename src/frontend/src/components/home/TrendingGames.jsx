// src/components/home/TrendingGames.jsx
import React, { useEffect, useCallback } from "react";
import useGameStore from "../../store/useGameStore";
import GameCarousel from "../common/GameCarousel";

const TrendingGames = () => {
  const { trendingGames, fetchGames, categoryStatus } = useGameStore();
  const slidesToShow = 5;
  const maxGames = 24;

  // Initial load
  useEffect(() => {
    fetchGames("trending");
  }, [fetchGames]);

  // Handle slide change to load more games if needed
  const handleSlideChange = useCallback((currentSlide) => {
    if ((currentSlide + 1) * slidesToShow >= trendingGames.length && trendingGames.length < maxGames) {
      console.log("Would fetch more trending games here");
    }
  }, [trendingGames.length, slidesToShow]);

  return (
    <GameCarousel
      title="Trending Now"
      viewAllLink="/discover/trending"
      games={trendingGames}
      maxGames={maxGames}
      slidesToShow={slidesToShow}
      onSlideChange={handleSlideChange}
      status={categoryStatus["trending"]}
      onRetry={() => fetchGames("trending")}
    />
  );
};

export default TrendingGames;
