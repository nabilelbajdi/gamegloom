import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Star } from "lucide-react";
import useGameStore from "../../store/useGameStore";
import SectionHeader from "../common/SectionHeader";

const GameListItem = ({ game }) => (
  <Link to={`/game/${game.slug || game.id}`} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-surface-dark/50 transition-colors">
    <img 
      src={game.coverImage} 
      alt={game.name} 
      className="w-12 h-16 object-cover rounded-md shadow-md"
      loading="lazy"
    />
    <div className="flex-1 min-w-0">
      <h4 className="text-white font-medium text-sm truncate">{game.name}</h4>
      <div className="flex items-center space-x-3 mt-1">
        {game.releaseDate && (
          <span className="text-white/60 text-xs">{new Date(game.releaseDate).getFullYear()}</span>
        )}
        <div className="flex items-center">
          <Star size={12} className="text-primary mr-1 fill-primary" />
          <span className="text-white/60 text-xs">
            {game.rating && game.rating !== "N/A" && !isNaN(parseFloat(game.rating)) 
              ? (typeof game.rating === 'number' ? game.rating.toFixed(1) : parseFloat(game.rating).toFixed(1))
              : "N/A"}
          </span>
        </div>
      </div>
    </div>
  </Link>
);

const GameListLoading = () => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center space-x-4 p-3 animate-pulse">
        <div className="w-12 h-16 bg-gray-800 rounded-md"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </>
);

const GameListColumn = ({ title, games, loading, viewAllLink }) => (
  <div className="flex-1 min-w-0">
    <div className="mb-4">
      <SectionHeader 
        title={title}
        viewAllLink={viewAllLink}
        showGradient={true}
      />
    </div>
    <div className="bg-surface-dark/30 backdrop-blur-sm rounded-xl overflow-hidden">
      {loading ? (
        <GameListLoading />
      ) : (
        <>
          {games && games.length > 0 ? (
            games.slice(0, 5).map((game) => (
              <GameListItem key={game.id} game={game} />
            ))
          ) : (
            <div className="p-4 text-center text-white/60">No games found</div>
          )}
        </>
      )}
    </div>
  </div>
);

const GameListSection = () => {
  const { latestGames, highlyRatedGames, anticipatedGames, fetchGames } = useGameStore();
  const [loading, setLoading] = useState({
    latest: true,
    highlyRated: true,
    anticipated: true
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(prev => ({ ...prev, latest: true }));
      await fetchGames("latest");
      setLoading(prev => ({ ...prev, latest: false }));
    };
    loadData();
  }, [fetchGames]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(prev => ({ ...prev, highlyRated: true }));
      await fetchGames("highlyRated");
      setLoading(prev => ({ ...prev, highlyRated: false }));
    };
    loadData();
  }, [fetchGames]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(prev => ({ ...prev, anticipated: true }));
      await fetchGames("anticipated");
      setLoading(prev => ({ ...prev, anticipated: false }));
    };
    loadData();
  }, [fetchGames]);

  return (
    <section className="pt-24 pb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GameListColumn 
          title="Recent Releases" 
          games={latestGames} 
          loading={loading.latest} 
          viewAllLink="/discover/latest-releases"
        />
        <GameListColumn 
          title="Highly Rated" 
          games={highlyRatedGames} 
          loading={loading.highlyRated} 
          viewAllLink="/discover/highly-rated"
        />
        <GameListColumn 
          title="Most Anticipated" 
          games={anticipatedGames} 
          loading={loading.anticipated} 
          viewAllLink="/discover/anticipated-games"
        />
      </div>
    </section>
  );
};

export default GameListSection; 