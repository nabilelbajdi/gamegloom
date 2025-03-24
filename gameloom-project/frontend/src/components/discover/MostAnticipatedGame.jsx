import React, { useEffect, useState } from "react";
import { Calendar, Users, Hourglass } from "lucide-react";
import { Link } from "react-router-dom";
import useGameStore from "../../store/useGameStore";

const MostAnticipatedGame = () => {
  const { anticipatedGames, fetchGames } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [topGame, setTopGame] = useState(null);

  useEffect(() => {
    const loadAnticipatedGames = async () => {
      setLoading(true);
      await fetchGames("anticipated");
      setLoading(false);
    };
    
    loadAnticipatedGames();
  }, [fetchGames]);

  useEffect(() => {
    if (anticipatedGames && anticipatedGames.length > 0) {
      const firstGame = anticipatedGames[0];

      if (firstGame && firstGame.coverImage) {
        setTopGame(firstGame);
      }
    }
  }, [anticipatedGames]);

  if (loading || !topGame) {
    return (
      <section className="relative my-16 overflow-hidden shadow-2xl bg-surface-dark h-96">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </section>
    );
  }

  // Format release date
  const formatReleaseDate = () => {
    if (!topGame.firstReleaseDate) return "TBA";
    
    try {
      const date = new Date(topGame.firstReleaseDate);
      if (!isNaN(date.getTime())) {
        // Check if it's December 31st (placeholder date)
        if (date.getMonth() === 11 && date.getDate() === 31) {
          return date.getFullYear().toString();
        }
        // Otherwise show full date
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      return "TBA";
    } catch {
      return "TBA";
    }
  };

  return (
    <section className="relative my-16 overflow-hidden shadow-2xl">
      {/* Background image with overlay */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 z-10"></div>
        {/* Top fade gradient */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black to-transparent z-10"></div>
        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent z-10"></div>
        
        {/* Use either a screenshot, artwork, or cover image for background */}
        <img 
          src={topGame.artworks?.[0] || topGame.screenshots?.[0] || topGame.coverImage} 
          alt={`${topGame.name} - Most Anticipated Game`} 
          className="w-full h-full object-cover object-center"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-20 mx-auto px-6 py-24 md:py-32">
        <div className="max-w-2xl ml-4 md:ml-8 lg:ml-12">
          <div className="mb-2 inline-flex items-center px-3 py-1 bg-primary/20 backdrop-blur-sm text-white text-sm tracking-wider rounded-full font-semibold">
            <Hourglass size={14} className="mr-1.5 text-primary fill-primary" />
            Most Anticipated
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            {topGame.name}
          </h2>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center text-white/80">
              <Users size={16} className="mr-1.5 text-primary" />
              <span className="font-medium">
                {topGame.developers
                  ? (typeof topGame.developers === 'string'
                      ? topGame.developers
                      : Array.isArray(topGame.developers)
                        ? topGame.developers.join(', ')
                        : topGame.developers)
                  : topGame.developer || 'Developer TBA'}
              </span>
            </div>
            
            <div className="text-white/80 border-l border-white/20 pl-4">
              <div className="flex items-center">
                <Calendar size={16} className="mr-2 text-primary" />
                <span>{formatReleaseDate()}</span>
              </div>
            </div>
            
            {topGame.genres && (
              <div className="text-white/80 border-l border-white/20 pl-4">
                {typeof topGame.genres === 'string' 
                  ? topGame.genres.split(',').slice(0, 3).join(', ')
                  : Array.isArray(topGame.genres) 
                    ? topGame.genres.slice(0, 3).join(', ')
                    : ''}
              </div>
            )}
          </div>
          
          <p className="text-white/90 mb-8 leading-relaxed line-clamp-2 md:line-clamp-none">
            {topGame.description || topGame.summary || `${topGame.name} is one of the most anticipated upcoming games. Stay tuned for more details as the release approaches.`}
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Link 
              to={`/game/${topGame.slug || topGame.id}`}
              className="px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-md hover:bg-white/20 backdrop-blur-sm transition-colors flex items-center"
            >
              View Details
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MostAnticipatedGame; 