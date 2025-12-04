import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const GenreListCardSkeleton = () => (
  <div className="relative w-full rounded-lg overflow-hidden bg-dark animate-pulse">
    <div className="relative h-[220px] p-3 overflow-hidden">
      {[...Array(3)].map((_, i) => (
        <div 
          key={i} 
          className={`absolute w-[45%] h-[180px] rounded-md bg-gray-800 shadow-lg ${
            i === 0 ? "top-4 left-4 rotate-[-5deg]" :
            i === 1 ? "top-4 left-[25%] rotate-[3deg] z-10" :
            "top-6 left-[45%] rotate-[8deg] z-20"
          }`}
        />
      ))}
    </div>
    <div className="relative p-3 bg-surface-dark/90">
      <div className="h-5 bg-gray-800 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-800 rounded w-1/3"></div>
    </div>
  </div>
);

const GenreListCard = ({ 
  title,
  slug, 
  games = [],
  type = "genre",
  loading = false 
}) => {
  const navigate = useNavigate();
  const [hoveredGameId, setHoveredGameId] = useState(null);

  if (loading || !games || games.length === 0) {
    return <GenreListCardSkeleton />;
  }

  const displayGames = games.slice(0, 3) || [];
  
  const handleClick = () => {
    if (type === "genre") {
      navigate(`/genre/${slug}`);
    } else if (type === "theme") {
      navigate(`/theme/${slug}`);
    }
  };
  
  const handleGameClick = (e, gameId) => {
    e.stopPropagation();
    navigate(`/game/${gameId}`);
  };
  
  return (
    <motion.div 
      className="relative w-full rounded-xl overflow-hidden bg-dark border border-gray-800/30 transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-black/30 group cursor-pointer"
      initial={{ scale: 1 }}
      onClick={handleClick}
    >
      {/* Covers Collage */}
      <div 
        className="relative h-[220px] bg-gray-900/50 overflow-hidden"
        onMouseLeave={() => setHoveredGameId(null)}
      >
        {/* Background image - using first game cover or fallback */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity duration-500"
          style={{ 
            backgroundImage: `url(${displayGames[0]?.coverImage || "/images/placeholder-cover.jpg"})`,
            filter: 'blur(6px)',
            transform: 'scale(1.1)'
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Three games layout - staggered */}
        {displayGames.map((game, index) => (
          <motion.div
            key={game.id}
            className={`absolute rounded-md overflow-hidden shadow-lg cursor-pointer ${
              index === 0 ? "w-[45%] h-[180px] top-4 left-4 rotate-[-5deg] z-5" :
              index === 1 ? "w-[45%] h-[180px] top-4 left-[25%] rotate-[3deg] z-10" :
              "w-[45%] h-[180px] top-6 left-[45%] rotate-[8deg] z-20"
            }`}
            style={{ 
              filter: hoveredGameId && hoveredGameId !== game.id ? 'blur(1px)' : 'none',
              transition: 'filter 0.2s ease-in-out'
            }}
            whileHover={{ y: -5, rotate: 0, transition: { duration: 0.2 } }}
            onClick={(e) => handleGameClick(e, game.id)}
            onMouseEnter={() => setHoveredGameId(game.id)}
          >
            <img
              src={game.coverImage || "/images/placeholder-cover.jpg"}
              alt={game.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
          </motion.div>
        ))}
        
        {/* Overlay */}
        <div className="absolute inset-0 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gray-900/10"></div>
      </div>
      
      {/* Genre/Theme Info Section */}
      <div className="relative p-4 bg-surface-dark/90">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-light text-lg group-hover:text-primary transition-colors">
            {title}
          </h4>
          <ChevronRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
};

export default GenreListCard;
export { GenreListCardSkeleton }; 