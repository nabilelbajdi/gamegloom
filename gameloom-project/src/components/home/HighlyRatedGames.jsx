import React, { useState, useEffect } from "react";
import GameCard from "../game/GameCard";
import { ChevronRight } from "lucide-react";
import { fetchHighlyRatedGames } from "../../../api";

const HighlyRatedGames = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function getGames() {
      setLoading(true);
      try {
        const data = await fetchHighlyRatedGames();
        setGames(data);
      } catch (err) {
        setError("Failed to fetch games");
      } finally {
        setLoading(false);
      }
    }

    getGames();
  }, []);

  return (
    <section className="container mx-auto px-4 md:px-20 py-8 md:py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gaming-light">Highly Rated Games</h2>
        <a href="/discover" className="text-gaming-secondary text-sm hover:underline hover:text-primary flex items-center">
          View All <ChevronRight className="ml-1 w-4 h-4" />
        </a>
      </div>

      {loading ? (
        <p className="text-center text-gray-400">Loading games...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
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

export default HighlyRatedGames;