import React from "react";
import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import CountdownTimer from "../common/CountdownTimer";

const FeaturedAnticipatedGameCard = ({ game }) => {
  const formatReleaseDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Link 
      to={`/game/${game.slug || game.igdb_id}`}
      className="block group relative h-full overflow-hidden rounded-lg transition-all duration-300"
    >
      {/* Countdown Timer */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="py-2 px-2 flex justify-center">
          {/* Blur background */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-[2px]" style={{ height: '100%', maxHeight: '68px' }}></div>
          <div className="relative z-10">
            <CountdownTimer releaseDate={game.firstReleaseDate} />
          </div>
        </div>
      </div>
      
      {/* Background Image with Gradient Overlay */}
      <div className="relative h-full">
        <img
          src={game.coverImage} 
          alt={game.name}
          className="h-full w-full object-cover brightness-[0.9] group-hover:brightness-[1] transition-all duration-500 scale-[1.02] group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
      </div>
      
      {/* Game Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {/* Blur background */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent backdrop-blur-[2px]" style={{ height: '100%', maxHeight: '80px' }}></div>
        
        <div className="relative z-10">
          {/* Game Title*/}
          <h3 className="text-xl font-bold text-white mb-0.5 truncate" title={game.name}>
            {game.name}
          </h3>
          
          {/* Release Date and Hype */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-2">
            <div className="text-gray-300 text-sm font-semibold mb-2 sm:mb-0">
              {formatReleaseDate(game.firstReleaseDate)}
            </div>
            
            {/* Hype Indicator with Flame Icon */}
            {game.hypes && (
              <div className="flex items-center space-x-1 bg-primary/10 px-2 py-1 rounded-md">
                <Flame size={16} className="text-flame fill-flame" />
                <span className="text-xs text-white font-semibold">{game.hypes}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedAnticipatedGameCard; 