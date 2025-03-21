import React, { useState } from "react";
import { Edit, Trash, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const ListCardSkeleton = () => (
  <div className="relative w-full rounded-lg overflow-hidden bg-dark animate-pulse">
    <div className="relative h-[180px] p-3 overflow-hidden">
      {[...Array(3)].map((_, i) => (
        <div 
          key={i} 
          className={`absolute w-[45%] h-[150px] rounded-md bg-gray-800 shadow-lg ${
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

const ListCard = ({ 
  list, 
  onSelectList,
  onEditList,
  onDeleteList,
  loading = false 
}) => {
  const navigate = useNavigate();
  const [hoveredGameId, setHoveredGameId] = useState(null);

  if (loading || !list) {
    return <ListCardSkeleton />;
  }

  const displayGames = list.games?.slice(0, 3) || [];
  
  const handleGameClick = (e, gameId) => {
    e.stopPropagation(); // Prevent triggering list selection
    navigate(`/game/${gameId}`);
  };
  
  return (
    <motion.div 
      className="relative w-full rounded-xl overflow-hidden bg-dark border border-gray-800/30 transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-black/30 group"
      initial={{ scale: 1 }}
    >
      {/* Covers Collage */}
      <div 
        className="relative h-[180px] bg-gray-900/50 overflow-hidden"
        onClick={() => onSelectList(list.id)}
        onMouseLeave={() => setHoveredGameId(null)}
      >
        {/* Background image - using first game cover or fallback */}
        {displayGames.length > 0 ? (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity duration-500"
            style={{ 
              backgroundImage: `url(${displayGames[0].coverImage || "/images/placeholder-cover.jpg"})`,
              filter: 'blur(6px)',
              transform: 'scale(1.1)'
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {displayGames.length > 0 ? (
          <>
            {displayGames.length === 1 ? (
              // Single game layout - centered
              <motion.div
                key={displayGames[0].id}
                className="absolute w-[45%] h-[150px] top-4 left-[27.5%] z-10 rounded-md overflow-hidden shadow-lg cursor-pointer"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                onClick={(e) => handleGameClick(e, displayGames[0].id)}
                onMouseEnter={() => setHoveredGameId(displayGames[0].id)}
              >
                <img
                  src={displayGames[0].coverImage || "/images/placeholder-cover.jpg"}
                  alt={displayGames[0].name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
              </motion.div>
            ) : displayGames.length === 2 ? (
              // Two games layout - balanced side by side
              <>
                <motion.div
                  key={displayGames[0].id}
                  className="absolute w-[45%] h-[150px] top-4 left-[8%] rotate-[-4deg] rounded-md overflow-hidden shadow-lg cursor-pointer z-5"
                  style={{ 
                    filter: hoveredGameId && hoveredGameId !== displayGames[0].id ? 'blur(1px)' : 'none',
                    transition: 'filter 0.2s ease-in-out'
                  }}
                  whileHover={{ y: -5, rotate: 0, transition: { duration: 0.2 } }}
                  onClick={(e) => handleGameClick(e, displayGames[0].id)}
                  onMouseEnter={() => setHoveredGameId(displayGames[0].id)}
                >
                  <img
                    src={displayGames[0].coverImage || "/images/placeholder-cover.jpg"}
                    alt={displayGames[0].name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                </motion.div>
                <motion.div
                  key={displayGames[1].id}
                  className="absolute w-[45%] h-[150px] top-4 left-[47%] rotate-[4deg] z-10 rounded-md overflow-hidden shadow-lg cursor-pointer"
                  style={{ 
                    filter: hoveredGameId && hoveredGameId !== displayGames[1].id ? 'blur(1px)' : 'none',
                    transition: 'filter 0.2s ease-in-out'
                  }}
                  whileHover={{ y: -5, rotate: 0, transition: { duration: 0.2 } }}
                  onClick={(e) => handleGameClick(e, displayGames[1].id)}
                  onMouseEnter={() => setHoveredGameId(displayGames[1].id)}
                >
                  <img
                    src={displayGames[1].coverImage || "/images/placeholder-cover.jpg"}
                    alt={displayGames[1].name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                </motion.div>
              </>
            ) : (
              // Three games layout - staggered
              displayGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  className={`absolute rounded-md overflow-hidden shadow-lg cursor-pointer ${
                    index === 0 ? "w-[45%] h-[150px] top-4 left-4 rotate-[-5deg] z-5" :
                    index === 1 ? "w-[45%] h-[150px] top-4 left-[25%] rotate-[3deg] z-10" :
                    "w-[45%] h-[150px] top-6 left-[45%] rotate-[8deg] z-20"
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
              ))
            )}
          </>
        ) : (
          // Placeholder if no games
          [...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className={`absolute rounded-md overflow-hidden shadow-lg bg-gray-800/50 flex items-center justify-center ${
                i === 0 ? "w-[45%] h-[150px] top-4 left-4 rotate-[-5deg]" :
                i === 1 ? "w-[45%] h-[150px] top-4 left-[25%] rotate-[3deg] z-10" :
                "w-[45%] h-[150px] top-6 left-[45%] rotate-[8deg] z-20"
              }`}
            >
              {i === 1 && (
                <span className="text-gray-500 text-xs text-center px-2">No games added</span>
              )}
            </div>
          ))
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gray-900/10"></div>
      </div>
      
      {/* List Info Section */}
      <div 
        className="relative p-4 bg-surface-dark/90 cursor-pointer"
        onClick={() => onSelectList(list.id)}
      >
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-light text-lg group-hover:text-primary transition-colors truncate max-w-[75%]" title={list.name}>
            {list.name}
          </h4>
          <div className="flex items-center gap-1">
            <motion.button 
              onClick={(e) => {
                e.stopPropagation();
                onEditList(list);
              }}
              className="p-1.5 rounded-full hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Edit list"
            >
              <Edit size={14} className="text-gray-400 group-hover:text-gray-300" />
            </motion.button>
            <motion.button 
              onClick={(e) => {
                e.stopPropagation();
                onDeleteList(list.id);
              }}
              className="p-1.5 rounded-full hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Delete list"
            >
              <Trash size={14} className="text-gray-400 group-hover:text-gray-300" />
            </motion.button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-400">
            {list.games?.length || 0} games
          </p>
          
          {/* View Full List Button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onSelectList(list.id);
            }}
            className="flex items-center text-xs text-primary font-medium cursor-pointer hover:opacity-80 transition-opacity"
          >
            View list <ChevronRight className="h-3 w-3 ml-1" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ListCard;
export { ListCardSkeleton }; 