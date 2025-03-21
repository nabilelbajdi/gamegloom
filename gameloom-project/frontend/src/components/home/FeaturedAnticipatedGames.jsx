import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useGameStore from "../../store/useGameStore";
import { getUpcomingFeaturedGames } from "../../utils/gameUtils";
import FeaturedAnticipatedGameCard from "../game/FeaturedAnticipatedGameCard";

const FeaturedAnticipatedGames = () => {
  const { anticipatedGames, fetchGames } = useGameStore();
  const [featuredGames, setFeaturedGames] = useState([]);

  useEffect(() => {
    if (!anticipatedGames || anticipatedGames.length === 0) {
      fetchGames("anticipated");
    }
  }, []);

  useEffect(() => {
    if (anticipatedGames && anticipatedGames.length > 0) {
      const sorted = getUpcomingFeaturedGames(anticipatedGames, 4);
      setFeaturedGames(sorted);
    }
  }, [anticipatedGames]);

  if (!featuredGames || featuredGames.length === 0) return null;

  return (
    <section className="mt-16 mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-light">
          <span className="text-primary">Anticipated Games</span> Coming Soon
        </h2>
        <Link 
          to="/discover/anticipated" 
          className="text-primary hover:text-primary-dark transition-colors text-sm mr-2"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {featuredGames.map(game => (
          <div key={game.id} className="relative h-[320px]">
            <FeaturedAnticipatedGameCard game={game} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedAnticipatedGames; 