import React from "react";
import Hero from "../components/Hero";
import FeaturedGames from "../components/FeaturedGames";
import ReviewedGames from "../components/ReviewedGames";

const Home = () => {
  return (
    <>
      <Hero />
      <FeaturedGames />
      <ReviewedGames />
    </>
  );
};

export default Home;