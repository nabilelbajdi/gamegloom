import React from "react";
import Hero from "../components/home/Hero";
import AnticipatedGames from "../components/home/AnticipatedGames";
import ReviewedGames from "../components/home/ReviewedGames";
import JoinCommunity from "../components/home/JoinCommunity";
import HighlyRatedGames from "../components/home/HighlyRatedGames";
import LatestGames from "../components/home/LatestGames";
import TrendingGames from "../components/home/TrendingGames";

const HomePage = () => {
  return (
    <>
      <Hero />
      {/* <TrendingGames /> */}
      <AnticipatedGames />
      <HighlyRatedGames />
      <LatestGames />
      <ReviewedGames />
      <JoinCommunity />
    </>
  );
};

export default HomePage;