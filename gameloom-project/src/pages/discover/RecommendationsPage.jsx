import React from "react";
import GameCategoryPage from "./GameCategoryPage";

const RecommendationsPage = () => {
  return (
    <GameCategoryPage
      title="Recommended Games"
      categoryType="recommendations"
      description="Games recommended based on your collection and preferences"
    />
  );
};

export default RecommendationsPage; 