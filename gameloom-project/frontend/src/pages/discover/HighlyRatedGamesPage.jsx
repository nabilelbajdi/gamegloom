import React from "react";
import GameCategoryPage from "./GameCategoryPage";

const HighlyRatedGamesPage = () => {
  return (
    <GameCategoryPage
      title="Highly Rated Games"
      categoryType="highlyRated"
      description="Top rated games that have received critical acclaim from both players and critics."
    />
  );
};

export default HighlyRatedGamesPage; 