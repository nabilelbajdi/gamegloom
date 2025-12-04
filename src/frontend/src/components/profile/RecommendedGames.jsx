import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Star, ThumbsUp } from 'lucide-react';
import useGameStore from '../../store/useGameStore';
import { useAuth } from "../../context/AuthContext";
import GameCardStatus from "../game/GameCardStatus";
import useStatusDropdown from "../../hooks/useStatusDropdown";
import { formatGenres } from "../../utils/gameCardUtils";
import SectionHeader from "../common/SectionHeader";

// Custom Star Rating
const CustomStarRating = ({ rating }) => (
  <div className="flex items-center">
    <Star className="w-3 h-3 text-primary fill-primary" />
    <span className="text-[10px] text-gray-300 ml-0.5">{rating}</span>
  </div>
);

// Custom GridGameCard
const CompactGridGameCard = ({ game, starRating }) => {
  const { user } = useAuth();
  const { 
    showStatusDropdown,
    coverImageRef, 
    handleCoverMouseLeave, 
    handleStatusChange 
  } = useStatusDropdown();
  
  return (
    <Link 
      to={`/game/${game.slug || game.igdb_id}`}
      className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-surface transition-all duration-300 hover:shadow-xl"
    >
      {/* Game Cover */}
      <div className="h-full" ref={coverImageRef} onMouseLeave={handleCoverMouseLeave}>
        <img 
          src={game.coverImage || game.cover_image} 
          alt={game.name} 
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.01] group-hover:opacity-90"
        />
        
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Status Ribbon */}
        {user && (
          <div className="absolute top-[-2px] left-0 z-10">
            <GameCardStatus 
              game={game}
              onStatusChange={handleStatusChange}
              showDropdown={showStatusDropdown}
              size="small"
            />
          </div>
        )}

        {/* Game information overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <h3 className="text-xs font-semibold text-white truncate">{game.name}</h3>
          <div className="flex items-center justify-between mt-0">
            <span className="text-[10px] text-gray-300">
              {formatGenres(game.genres, 1)}
            </span>
            {starRating}
          </div>
        </div>
      </div>
    </Link>
  );
};

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
    <div className="bg-surface-dark/30 rounded-xl border border-gray-800/20 overflow-hidden shadow-md">
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
          <div className="grid grid-cols-3 gap-4">
            {recommendedGames.slice(0, 6).map((game) => (
              <div key={game.id} className="flex-shrink-0 rounded-lg overflow-hidden">
                <CompactGridGameCard 
                  game={game}
                  starRating={game.rating !== "N/A" && <CustomStarRating rating={game.rating} />}
                />
              </div>
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