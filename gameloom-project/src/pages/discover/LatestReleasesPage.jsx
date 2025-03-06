import React from "react";
import GameCategoryPage from "./GameCategoryPage";

const LatestReleasesPage = () => {
  return (
    <GameCategoryPage
      title="Latest Releases"
      categoryType="latest"
      description="Recently released games that have just hit the market for you to discover."
    />
  );
};

export default LatestReleasesPage; 