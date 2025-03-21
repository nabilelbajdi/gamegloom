import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

const ActivityFeedGameCover = ({ game }) => {
  return (
    <div className="relative w-16 md:w-20 shrink-0 overflow-hidden mr-1">
      {/* Game Cover */}
      <Link 
        to={`/game/${game.slug || game.igdb_id}`} 
        className="block relative overflow-hidden group cursor-pointer rounded-lg aspect-[3/4]"
      >
        <img
          src={game.coverImage || game.cover_image} 
          alt={game.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
        />
        
        {/* Hover overlay with "View Game" button */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* View Game Button */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[48px]">
            <div className="px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded flex items-center justify-center gap-0.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <span className="text-[8px] font-semibold text-white whitespace-nowrap">View</span>
              <ExternalLink className="h-2 w-2 text-white stroke-3" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ActivityFeedGameCover; 