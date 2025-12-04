// src/components/home/TrendingGames.jsx
import React, { useState, useEffect, useCallback } from "react";
import useGameStore from "../../store/useGameStore";
import GameCarousel from "../common/GameCarousel";

// GameCard Skeleton
const GameCardSkeleton = () => (
  <div className="block group relative overflow-hidden rounded-lg bg-surface transition-all duration-300">
    <div className="aspect-[3/4] overflow-hidden rounded-md relative bg-gray-800 animate-pulse"></div>
    <div className="p-3 bg-surface-dark">
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
      <div className="h-3 bg-gray-700 rounded w-1/2 mb-2 animate-pulse"></div>
      <div className="mt-2 flex items-center justify-between">
        <div className="h-3 bg-gray-700 rounded w-8 animate-pulse"></div>
      </div>
    </div>
  </div>
);

// Loading Carousel
const LoadingCarousel = ({ slidesToShow }) => {
  const skeletonArray = Array(slidesToShow).fill(null);
  
  return (
    <section className="mt-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-light">Trending Now</h2>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-surface-dark/60 backdrop-blur-sm flex items-center justify-center"></div>
          <div className="w-8 h-8 rounded-full bg-surface-dark/60 backdrop-blur-sm flex items-center justify-center"></div>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {skeletonArray.map((_, index) => (
          <div key={index} className="px-2">
            <GameCardSkeleton />
          </div>
        ))}
      </div>
    </section>
  );
};

const TrendingGames = () => {
  const { trendingGames, fetchGames } = useGameStore();
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
    return <LoadingCarousel slidesToShow={slidesToShow} />;
  }
  
  return (
    <GameCarousel
      title="Trending Now"
      viewAllLink="/discover/trending"
      games={trendingGames}
      maxGames={maxGames}
      slidesToShow={slidesToShow}
      onSlideChange={handleSlideChange}
    />
  );
};

export default TrendingGames;
