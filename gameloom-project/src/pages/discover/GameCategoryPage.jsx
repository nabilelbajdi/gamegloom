import React, { useState, useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import CategoryHeader from "../../components/discover/CategoryHeader";
import GamesGrid from "../../components/discover/GamesGrid";
import { Search } from "lucide-react";

const GameCategoryPage = ({ 
  title, 
  categoryType, 
  description = ""
}) => {
  const { 
    fetchGames,
    trendingGames,
    anticipatedGames,
    highlyRatedGames,
    latestGames
  } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const getGamesForCategory = () => {
    switch (categoryType) {
      case "trending": return trendingGames;
      case "anticipated": return anticipatedGames;
      case "highlyRated": return highlyRatedGames;
      case "latest": return latestGames;
      default: return [];
    }
  };

  useEffect(() => {
    const loadGames = async () => {
      setLoading(true);
      await fetchGames(categoryType);
      setLoading(false);
    };

    loadGames();
  }, [categoryType, fetchGames]);

  const games = getGamesForCategory();
  
  const filteredGames = searchQuery
    ? games.filter(game => 
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (game.description && game.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : games;

  return (
    <div className="min-h-screen bg-dark">
      {/* Header Section */}
      <CategoryHeader 
        title={title} 
        description={description}
      />
      
      <div className="container mx-auto px-4 py-6">
        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* Games Count */}
          <div className="text-light/70 text-sm order-1 sm:order-none">
            <span className="font-medium text-light">{filteredGames.length}</span> Games
          </div>

          {/* Search Bar */}
          <div className="relative order-0 sm:order-none shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              className="w-64 px-2.5 py-1.5 pl-9 bg-surface/50 rounded-lg text-xs text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary/50 hover:bg-surface-hover/50 transition-colors"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
        
        {/* Games Grid */}
        <GamesGrid
          games={filteredGames}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default GameCategoryPage; 