import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Hourglass } from "lucide-react";
import useGameStore from "../../store/useGameStore";
import { getUpcomingFeaturedGames } from "../../utils/gameUtils";
import FeaturedAnticipatedGameCard from "../game/FeaturedAnticipatedGameCard";
import SectionHeader from "../common/SectionHeader";

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
      <SectionHeader
        title="Coming Soon"
        viewAllLink="/discover/anticipated"
        showGradient={true}
      />

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