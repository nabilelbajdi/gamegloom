import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import useGameStore from '../../store/useGameStore';
import GridGameCard from "../game/GridGameCard";
import SectionHeader from "../common/SectionHeader";

const RecommendedGames = () => {
  const { recommendedGames, fetchGames } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      setIsLoading(true);
      try {
        await fetchGames('recommendations');
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, [fetchGames]);

  return (
    <div className="bg-[var(--bg-elevated-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-md">
      <div className="px-6 py-5 border-b border-gray-800/30">
        <SectionHeader
          title="Games For You"
          viewAllLink="/discover/recommendations"
          showGradient={true}
        />
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : recommendedGames.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {recommendedGames.slice(0, 6).map((game) => (
              <GridGameCard key={game.id} game={game} smallStatus={true} compact={true} />
            ))}
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <h3 className="text-gray-300 font-medium mb-2">No Recommendations Yet</h3>
            <p className="text-gray-500 text-sm max-w-xs">
              Add more games to your collection to get personalized recommendations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendedGames;