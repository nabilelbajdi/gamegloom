import React from "react";
import GameCard from "./GameCard";
import featuredGames from "../data/featuredGames";

const FeaturedGames = () => {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gaming-light">Featured Games</h2>
        <a href="/discover" className="text-gaming-secondary text-sm hover:underline">
          View All →
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
        {featuredGames.map((game, index) => (
          <GameCard key={index} {...game} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedGames;
