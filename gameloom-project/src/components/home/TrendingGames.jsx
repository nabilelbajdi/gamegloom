import React, { useEffect } from "react";
import GameCard from "../game/GameCard";
import { ChevronRight } from "lucide-react";
import useGameStore from "../../store/useGameStore";

const TrendingGames = () => {
  const { games, fetchTrendingGames } = useGameStore();

  useEffect(() => {
    fetchTrendingGames(); // Fetch games once, then reuse from state
  }, []);

  return (
    <section className="container mx-auto px-4 md:px-20 py-8 md:py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gaming-light">Trending Games</h2>
        <a href="/discover" className="text-gaming-secondary text-sm hover:underline hover:text-primary flex items-center">
          View All <ChevronRight className="ml-1 w-4 h-4" />
        </a>
      </div>

      {games.length === 0 ? (
        <p className="text-center text-gray-400">Loading games...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {games.map((game, index) => (
            <GameCard key={index} {...game} />
          ))}
        </div>
      )}
    </section>
  );
};

export default TrendingGames;
