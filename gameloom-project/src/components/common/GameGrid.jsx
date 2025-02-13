import React from "react";
import { ChevronRight } from "lucide-react";
import GameCard from "../game/GameCard";

const GameGrid = ({ title, viewAllLink, games, loading }) => (
  <section className="container mx-auto px-4 md:px-20 py-8 md:py-8">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-gaming-light">{title}</h2>
      {viewAllLink && (
        <a href={viewAllLink} className="text-gaming-secondary text-sm hover:underline hover:text-primary flex items-center">
          View All <ChevronRight className="ml-1 w-4 h-4" />
        </a>
      )}
    </div>

    {loading ? (
      <p className="text-center text-gray-400">Loading games...</p>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    )}
  </section>
);

export default GameGrid;
