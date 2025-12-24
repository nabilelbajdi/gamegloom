import React from "react";
import { Link } from "react-router-dom";

const RelatedGameCover = ({ game }) => {
  return (
    <Link
      to={`/game/${game.id}`}
      className="block group relative aspect-[3/4] rounded-md overflow-hidden bg-surface transition-all duration-300 hover:shadow-md"
    >
      {/* Game Cover */}
      <div className="h-full">
        <img
          src={game.cover_image || "/images/fallback.jpg"}
          alt={game.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05] group-hover:opacity-90"
        />

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Game title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 transform translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <h3 className="text-xs font-semibold text-white line-clamp-2">{game.name}</h3>
        </div>
      </div>
    </Link>
  );
};

export default RelatedGameCover; 