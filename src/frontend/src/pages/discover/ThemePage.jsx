import React from "react";
import { useParams } from "react-router-dom";
import GameCategoryPage from "./GameCategoryPage";

const ThemePage = () => {
  const { themeSlug } = useParams();
  
  const themeNames = {
    "action": "Action Games",
    "fantasy": "Fantasy Games",
    "science-fiction": "Science Fiction Games",
    "horror": "Horror Games",
    "thriller": "Thriller Games",
    "survival": "Survival Games",
    "historical": "Historical Games",
    "stealth": "Stealth Games",
    "comedy": "Comedy Games",
    "business": "Business Games",
    "drama": "Drama Games",
    "mystery": "Mystery Games",
    "educational": "Educational Games",
    "kids": "Kids Games",
    "open-world": "Open World Games",
    "warfare": "Warfare Games"
  };

  const themeName = themeNames[themeSlug] || `${themeSlug.charAt(0).toUpperCase() + themeSlug.slice(1)} Games`;
  
  return (
    <GameCategoryPage
      title={themeName}
      categoryType="theme"
      description={`Discover the best ${themeName.toLowerCase()} across all platforms.`}
      themeFilter={themeSlug}
    />
  );
};

export default ThemePage; 