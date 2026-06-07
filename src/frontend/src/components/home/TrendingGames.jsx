// src/components/home/TrendingGames.jsx
import React, { useState, useEffect, useCallback } from "react";
import useGameStore from "../../store/useGameStore";
import GameCarousel from "../common/GameCarousel";
import { CarouselSkeleton } from "../common/Skeleton";

const TrendingGames = () => {
  const { trendingGames, fetchGames, categoryStatus } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [currentBatch, setCurrentBatch] = useState(0);
  const slidesToShow = 5;
  const maxGames = 24;

  // Initial load
  useEffect(() => {
    const loadInitialGames = async () => {
      setLoading(true);
      await fetchGames("trending");
      setLoading(false);
    };

    loadInitialGames();
  }, [fetchGames]);

  // Handle slide change to load more games if needed
  const handleSlideChange = useCallback((currentSlide) => {
    setCurrentBatch(currentSlide);

    if ((currentSlide + 1) * slidesToShow >= trendingGames.length && trendingGames.length < maxGames) {
      console.log("Would fetch more trending games here");
    }
  }, [trendingGames.length, slidesToShow]);

  if (loading) {
    return <CarouselSkeleton title="Trending Now" slidesToShow={slidesToShow} />;
  }

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
