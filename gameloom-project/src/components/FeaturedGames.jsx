import React from "react";
import GameCard from "./GameCard";
import featuredGames from "../data/featuredGames";

const FeaturedGames = () => {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold font-heading text-gradient">Featured Games</h2>
        <p className="text-xl text-gray-400 mb-8">Hand-picked by us, these games are trending right now.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredGames.map((game, index ) => (
          <GameCard key={index} {...game} />
        ))}
      </div>
    </section>
  ); 
};

export default FeaturedGames;