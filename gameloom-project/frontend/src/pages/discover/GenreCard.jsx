import React from "react";
import { useNavigate } from "react-router-dom";

const GenreCardSkeleton = () => (
  <div className="relative w-full max-w-[320px] rounded-lg overflow-hidden bg-dark animate-pulse">
    <div className="relative flex gap-2 p-2 overflow-hidden">
      {[...Array(3)].map((_, i) => (
        <div 
          key={i} 
          className="w-1/3 h-[150px] rounded-md bg-gray-800"
        />
      ))}
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-3 bg-dark/80">
      <div className="h-5 bg-gray-800 rounded w-3/4 mx-auto"></div>
    </div>
  </div>
);

const GenreCard = ({ 
  title, 
  games = [], 
  genreSlug, 
  type = "genre", 
  loading = false 
}) => {
  const navigate = useNavigate();

  const handleNavigation = () => {
    if (type === "genre") {
      navigate(`/genre/${genreSlug}`);
    } else if (type === "theme") {
      navigate(`/theme/${genreSlug}`);
    }
  };

  if (loading || games.length === 0) {
    return <GenreCardSkeleton />;
  }

  return (
    <div
      className="relative w-full max-w-[320px] rounded-lg overflow-hidden bg-dark cursor-pointer"
      onClick={handleNavigation}
    >
      {/* Game Covers */}
      <div className="relative flex gap-2 p-2 overflow-hidden">
        {games.slice(0, 3).map((game, index) => (
          <img
            key={game.id}
            src={game.coverImage || "/images/placeholder-cover.jpg"}
            alt={game.name}
            className={`w-1/3 h-[150px] object-cover rounded-md ${
              index === 1 ? "scale-105" : "opacity-70"
            } transition-transform`}
            loading="lazy"
          />
        ))}
      </div>
      
      {/* Genre/Theme Title */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-dark/80 text-white text-center font-semibold">
        {title}
      </div>
    </div>
  );
};

export default GenreCard;
export { GenreCardSkeleton };
