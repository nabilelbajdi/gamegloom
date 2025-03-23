// src/pages/HomePage.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import Hero from "../components/home/HeroSection";
import AnticipatedGames from "../components/home/AnticipatedGames";
import ReviewedGames from "../components/home/ReviewedGames";
import JoinCommunity from "../components/home/JoinCommunity";
import HighlyRatedGames from "../components/home/HighlyRatedGames";
import LatestGames from "../components/home/LatestGames";
import TrendingGames from "../components/home/TrendingGames";
import FeaturedAnticipatedGames from "../components/home/FeaturedAnticipatedGames";

const HomePage = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <>
        <Hero />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-8 bg-gray-700 rounded w-1/4"></div>
                <div className="grid grid-cols-6 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <div key={j} className="aspect-[3/4] bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Hero />
      <div className="bg-gradient-to-b from-black/95 to-black">
        <div className="container mx-auto px-4 py-6">
          <FeaturedAnticipatedGames />
          <TrendingGames />
          <AnticipatedGames />
          <HighlyRatedGames />
          <LatestGames />
        </div>
        <ReviewedGames />
        <JoinCommunity />
      </div>
    </>
  );
};

export default HomePage;