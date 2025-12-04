import React from "react";
import { Star, ThumbsUp, MessageCircle, Clock, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const RecentReviewCard = ({ review }) => {
  const { game, user, rating, content, created_at, likes_count, comments_count } = review;

  return (
    <div className="bg-surface-dark rounded-xl overflow-hidden transition-all duration-300">
      <div className="flex h-full">
        {/* Game Cover */}
        <Link 
          to={`/game/${game.igdb_id}`}
          className="group relative w-[140px] flex-shrink-0 overflow-hidden aspect-[3/4]"
        >
          <img
            src={game.cover_image}
            alt={game.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          />
          {/* Hover overlay with "View Game" button */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* View Game Button */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[72px]">
              <div className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-md flex items-center justify-center gap-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <span className="text-[10px] font-semibold text-white whitespace-nowrap">View Game</span>
                <ExternalLink className="h-2.5 w-2.5 text-white stroke-3" />
              </div>
            </div>
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between min-h-[180px]">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3>
                  <Link 
                    to={`/game/${game.igdb_id}`}
                    className="inline-block text-lg font-semibold text-light hover:text-primary transition-colors max-w-[200px] truncate"
                  >
                    {game.name}
                  </Link>
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={`${
                          i < rating ? "fill-primary text-primary" : "fill-gray-600 text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* User Info */}
              <Link 
                to={`/user/${user.id}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/images/default-avatar.svg";
                    }}
                  />
                </div>
                <span className="text-sm text-gray-300 font-medium">{user.username}</span>
              </Link>
            </div>

            {/* Review Content */}
            <div className="mt-3">
              <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                {content || "No review content provided."}
              </p>
              <Link 
                to={`/game/${game.igdb_id}/reviews/${review.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                View full review <ExternalLink size={12} />
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700/50">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Clock size={14} />
              <span>{formatDistanceToNow(new Date(created_at), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <ThumbsUp size={14} />
                <span>{likes_count}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <MessageCircle size={14} />
                <span>{comments_count}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentReviewCard; 