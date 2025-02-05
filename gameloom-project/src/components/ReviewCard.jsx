import React, { useState } from "react";
import { ThumbsUp, MessageCircle, Calendar, UserPlus, UserX } from "lucide-react";

const ReviewCard = ({ 
  gameTitle, 
  platform, 
  reviewText, 
  user, 
  userAvatar, 
  userFollowers, 
  userReviews, 
  date, 
  likes,
  comments, 
  coverImage, 
  rating 
}) => {
  const [hasLiked, setHasLiked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <article className="flex gap-6 p-6 border-l-6 border-gray-700 bg-gray-800 rounded-lg shadow-lg">
      {/* Left Section: User Info */}
      <div className="flex flex-col items-center w-32">
        <img src={userAvatar} alt={`${user} avatar`} className="w-24 h-24 mb-2 rounded-full object-cover ring-2 ring-gray-700 hover:ring-secondary transition-all duration-300 cursor-pointer" />
        <div className="mt-2 text-sm font-bold text-light cursor-pointer">{user}</div>
        <button
          onClick={() => setIsFollowing(!isFollowing)}
          className={`mt-2 w-full px-3 py-1 text-xs font-medium rounded-md transition-all duration-300 cursor-pointer ${
            isFollowing ? "bg-secondary text-light" : "bg-gray-700 hover:bg-secondary"
          }`}
        >
          {isFollowing ? (
            <>
              <UserX className="w-4 h-4 inline-block mr-1" /> Unfollow
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 inline-block mr-1" /> Follow
            </>
          )}
        </button>
        <div className="mt-2 text-xs text-gray-400 text-center">
          <p><span className="font-medium">Followers:</span> {userFollowers}</p>
          <p><span className="font-medium">Reviews:</span> {userReviews}</p>
        </div>
      </div>

      {/* Cover Art Section */}
      <div className="w-34 flex-shrink-0">
        <img src={coverImage} alt={`${gameTitle} cover`} className="game-card relative group w-full h-48 object-cover transition-transform duration-300 group-hover:scale-102" />
      </div>

      {/* Review Content */}
      <div className="flex-1 flex flex-col">
        {/* Title & Review Text */}
        <div className="flex-1 mt-2">
          <h4 className="text-lg font-semibold text-light hover:text-primary transition-colors">{gameTitle}</h4>
          <p className="text-sm text-gray-500 mt-1">{platform}</p>
          <p className={`text-sm text-gray-300 mt-1 ${isExpanded ? "" : "line-clamp-3"}`}>{reviewText}</p>
          {reviewText.length > 300 && (
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-primary text-sm mt-1 hover:text-primary/80 transition-colors cursor-pointer">
              {isExpanded ? "Show Less" : "Show More"}
            </button>
          )}
        </div>

        {/* Full-width Bottom Section */}
        <div className="mt-4 pt-2 border-t border-gray-700 flex justify-between items-center w-full text-sm">
          {/* Date on the Bottom Left */}
          <span className="text-gray-500 flex items-center"><Calendar className="w-4 h-4 mr-1" /> {date}</span>

          {/* Right Section: Rating & Review Actions */}
          <div className="flex items-center gap-6">
            {/* Star Rating */}
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`w-4 h-4 ${i < rating ? "text-primary" : "text-gray-500"}`}>★</span>
              ))}
            </div>

            {/* Like Button */}
            <button onClick={() => setHasLiked(!hasLiked)} className={`flex items-center gap-1 transition-all duration-300 cursor-pointer ${hasLiked ? "text-primary" : "text-gray-400 hover:text-primary"}`}>
              <ThumbsUp className="w-4 h-4" />
              {likes + (hasLiked ? 1 : 0)}
            </button>

            {/* Comments */}
            <span className="flex items-center gap-1 text-gray-400 transition-all duration-300 hover:text-primary cursor-pointer">
              <MessageCircle className="w-4 h-4" />
              {comments || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ReviewCard;