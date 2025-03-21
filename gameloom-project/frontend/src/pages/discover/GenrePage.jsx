import React from "react";
import { useParams } from "react-router-dom";
import GameCategoryPage from "./GameCategoryPage";

const GenrePage = () => {
  const { genreSlug } = useParams();
  
  const genreNames = {
    "adventure": "Adventure Games",
    "rpg": "Role-Playing Games",
    "shooter": "Shooter Games",
    "strategy": "Strategy Games",
    "platform": "Platform Games",
    "puzzle": "Puzzle Games",
    "racing": "Racing Games",
    "fighting": "Fighting Games",
    "indie": "Indie Games",
    "simulator": "Simulator Games",
    "sport": "Sports Games",
    "arcade": "Arcade Games",
    "card": "Card & Board Games",
    "visual-novel": "Visual Novel Games",
    "moba": "MOBA Games",
    "tactical": "Tactical Games"
  };

  const genreName = genreNames[genreSlug] || `${genreSlug.charAt(0).toUpperCase() + genreSlug.slice(1)} Games`;
  
  return (
    <GameCategoryPage
      title={genreName}
      categoryType="genre"
      description={`Discover the best ${genreName.toLowerCase()} across all platforms.`}
      genreFilter={genreSlug}
    />
  );
};

export default GenrePage; 