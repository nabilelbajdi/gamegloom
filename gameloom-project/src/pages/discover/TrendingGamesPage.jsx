import React from "react";
import GameCategoryPage from "./GameCategoryPage";

const TrendingGamesPage = () => {
  return (
    <GameCategoryPage
      title="Trending Games"
      categoryType="trending"
      description="Discover the most popular games that gamers are playing right now."
    />
  );
};

export default TrendingGamesPage; 