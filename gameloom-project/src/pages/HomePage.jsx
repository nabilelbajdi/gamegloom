import React from "react";
import Hero from "../components/home/Hero";
import AnticipatedGames from "../components/home/AnticipatedGames";
import ReviewedGames from "../components/home/ReviewedGames";
import JoinCommunity from "../components/home/JoinCommunity";
import HighlyRatedGames from "../components/home/HighlyRatedGames";
import NewGames from "../components/home/NewGames";

const HomePage = () => {
  return (
    <>
      <Hero />
      <AnticipatedGames />
      <HighlyRatedGames />
      <NewGames />
      <ReviewedGames />
      <JoinCommunity />
    </>
  );
};

export default HomePage;