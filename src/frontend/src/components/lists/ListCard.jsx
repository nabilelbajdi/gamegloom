import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ListCard = ({ list, onLike }) => {
    const navigate = useNavigate();
    const [hoveredGameId, setHoveredGameId] = useState(null);
    const displayGames = list.games?.slice(0, 3) || [];

    const handleClick = () => {
        navigate(`/lists/${list.id}`);
    };

    const handleGameClick = (e, gameId) => {
        e.stopPropagation();
        navigate(`/game/${gameId}`);
    };

    const handleLikeClick = (e) => {
        e.stopPropagation();
        if (onLike) onLike(list.id, list.user_liked);
    };

    return (
        <motion.div
            className="relative w-full rounded-xl overflow-hidden bg-dark transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-black/30 group cursor-pointer"
            initial={{ scale: 1 }}
            onClick={handleClick}
        >
            {/* Covers Collage - matching library ListCard style */}
            <div
                className="relative h-[180px] bg-gray-900/50 overflow-hidden"
                onMouseLeave={() => setHoveredGameId(null)}
            >
                {/* Background blur from first game */}
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
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40" />

                {displayGames.length > 0 ? (
                    <>
                        {displayGames.length === 1 ? (
                            <motion.div
                                className="absolute w-[45%] h-[150px] top-4 left-[27.5%] z-10 rounded-md overflow-hidden shadow-lg"
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                onClick={(e) => handleGameClick(e, displayGames[0].igdb_id || displayGames[0].id)}
                                onMouseEnter={() => setHoveredGameId(displayGames[0].id)}
                            >
                                <img
                                    src={displayGames[0].coverImage || "/images/placeholder-cover.jpg"}
                                    alt={displayGames[0].name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                            </motion.div>
                        ) : displayGames.length === 2 ? (
                            <>
                                <motion.div
                                    className="absolute w-[45%] h-[150px] top-4 left-[8%] rotate-[-4deg] rounded-md overflow-hidden shadow-lg z-5"
                                    style={{
                                        filter: hoveredGameId && hoveredGameId !== displayGames[0].id ? 'blur(1px)' : 'none',
                                        transition: 'filter 0.2s ease-in-out'
                                    }}
                                    whileHover={{ y: -5, rotate: 0, transition: { duration: 0.2 } }}
                                    onClick={(e) => handleGameClick(e, displayGames[0].igdb_id || displayGames[0].id)}
                                    onMouseEnter={() => setHoveredGameId(displayGames[0].id)}
                                >
                                    <img
                                        src={displayGames[0].coverImage || "/images/placeholder-cover.jpg"}
                                        alt={displayGames[0].name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                </motion.div>
                                <motion.div
                                    className="absolute w-[45%] h-[150px] top-4 left-[47%] rotate-[4deg] z-10 rounded-md overflow-hidden shadow-lg"
                                    style={{
                                        filter: hoveredGameId && hoveredGameId !== displayGames[1].id ? 'blur(1px)' : 'none',
                                        transition: 'filter 0.2s ease-in-out'
                                    }}
                                    whileHover={{ y: -5, rotate: 0, transition: { duration: 0.2 } }}
                                    onClick={(e) => handleGameClick(e, displayGames[1].igdb_id || displayGames[1].id)}
                                    onMouseEnter={() => setHoveredGameId(displayGames[1].id)}
                                >
                                    <img
                                        src={displayGames[1].coverImage || "/images/placeholder-cover.jpg"}
                                        alt={displayGames[1].name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                </motion.div>
                            </>
                        ) : (
                            displayGames.map((game, index) => (
                                <motion.div
                                    key={game.id}
                                    className={`absolute rounded-md overflow-hidden shadow-lg ${index === 0 ? "w-[45%] h-[150px] top-4 left-4 rotate-[-5deg] z-5" :
                                        index === 1 ? "w-[45%] h-[150px] top-4 left-[25%] rotate-[3deg] z-10" :
                                            "w-[45%] h-[150px] top-6 left-[45%] rotate-[8deg] z-20"
                                        }`}
                                    style={{
                                        filter: hoveredGameId && hoveredGameId !== game.id ? 'blur(1px)' : 'none',
                                        transition: 'filter 0.2s ease-in-out'
                                    }}
                                    whileHover={{ y: -5, rotate: 0, transition: { duration: 0.2 } }}
                                    onClick={(e) => handleGameClick(e, game.igdb_id || game.id)}
                                    onMouseEnter={() => setHoveredGameId(game.id)}
                                >
                                    <img
                                        src={game.coverImage || "/images/placeholder-cover.jpg"}
                                        alt={game.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                </motion.div>
                            ))
                        )}
                    </>
                ) : (
                    [...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className={`absolute rounded-md overflow-hidden shadow-lg bg-gray-800/50 flex items-center justify-center ${i === 0 ? "w-[45%] h-[150px] top-4 left-4 rotate-[-5deg]" :
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

                {/* Hover overlay */}
                <div className="absolute inset-0 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gray-900/10" />
            </div>

            {/* List Info Section */}
            <div className="relative p-4 bg-surface-dark/90">
                <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-light text-lg group-hover:text-primary transition-colors truncate flex-1" title={list.name}>
                        {list.name}
                    </h4>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Like button - only show if likes > 0 */}
                        {list.likes_count > 0 && (
                            <button
                                onClick={handleLikeClick}
                                className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors"
                            >
                                <Heart
                                    size={14}
                                    className={list.user_liked ? "fill-red-500 text-red-500" : ""}
                                />
                                <span className="text-sm font-medium">{list.likes_count}</span>
                            </button>
                        )}
                        <ChevronRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>

                {/* Description - fixed height area for consistency */}
                <div className="h-10 mt-1.5">
                    {list.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">
                            {list.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>by</span>
                        <span className="text-gray-400 font-medium">{list.creator?.username || "Unknown"}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                        {list.game_count || list.games?.length || 0} games
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

// Loading skeleton - matching library style
export const ListCardSkeleton = () => (
    <div className="relative w-full rounded-xl overflow-hidden bg-dark animate-pulse">
        <div className="relative h-[180px] p-3 overflow-hidden">
            {[...Array(3)].map((_, i) => (
                <div
                    key={i}
                    className={`absolute w-[45%] h-[150px] rounded-md bg-gray-800 shadow-lg ${i === 0 ? "top-4 left-4 rotate-[-5deg]" :
                        i === 1 ? "top-4 left-[25%] rotate-[3deg] z-10" :
                            "top-6 left-[45%] rotate-[8deg] z-20"
                        }`}
                />
            ))}
        </div>
        <div className="relative p-4 bg-surface-dark/90">
            <div className="h-5 bg-gray-800 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-800 rounded w-full mb-2" />
            <div className="h-3 bg-gray-800 rounded w-1/3" />
        </div>
    </div>
);

export default ListCard;
