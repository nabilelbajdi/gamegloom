import React from "react";
import Hero from "../components/Hero";
import FeaturedGames from "../components/FeaturedGames";
import ReviewedGames from "../components/ReviewedGames";
import JoinCommunity from "../components/JoinCommunity";
import TrendingGames from "../components/TrendingGames";
import NewGames from "../components/NewGames";

const Home = () => {
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

export default Home;