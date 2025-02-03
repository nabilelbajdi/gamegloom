import React from "react";
import Hero from "../components/Hero";
import FeaturedGames from "../components/FeaturedGames";
import ReviewedGames from "../components/ReviewedGames";
import JoinCommunity from "../components/JoinCommunity";
const Home = () => {
  return (
    <>
      <Hero />
      <FeaturedGames />
      <ReviewedGames />
      <JoinCommunity />
    </>
  );
};

export default Home;