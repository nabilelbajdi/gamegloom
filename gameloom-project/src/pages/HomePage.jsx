import React from "react";
import Hero from "../components/home/Hero";
import FeaturedGames from "../components/home/FeaturedGames";
import ReviewedGames from "../components/home/ReviewedGames";
import JoinCommunity from "../components/home/JoinCommunity";
import TrendingGames from "../components/home/TrendingGames";
import NewGames from "../components/home/NewGames";

const HomePage = () => {
  return (
    <>
      <Hero />
      <FeaturedGames />
      <TrendingGames />
      <NewGames />
      <ReviewedGames />
      <JoinCommunity />
    </>
  );
};

export default HomePage;