import React from "react";

const ReviewCard = ({ gameTitle, platform, reviewText, user, date, likes, dislikes, comments, coverImage, userAvatar }) => {
  return (
    <article className="bg-gray-800 rounded-lg shadow p-4 flex flex-col justify-between">
      {/* Top Section: Cover + Info */}
      <div className="flex gap-4">
        <img
          src={coverImage}
          alt={`${gameTitle} cover`}
          className="w-24 h-32 object-cover rounded-md hover:scale-105 transition-all duration-300 cursor-pointer"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="cursor-pointer text-xl font-semibold text-gradient">{gameTitle}</h3> 
            <span className="text-sm font-bold text-gray-400">{platform}</span>
          </div>
          <p className="mt-2 text-gray-300">{reviewText}</p>
        </div>
      </div>

      {/* Divider + Bottom Section */}
      <div className="mt-4 pt-2 border-t border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={userAvatar}
            alt={`${user} avatar`}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="text-sm text-gray-300 font-medium">{user}</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{date}</span>
          <div className="flex items-center gap-1">
            <i className="fas fa-thumbs-up text-gray-500"></i>
            <span>{likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <i className="fas fa-thumbs-down text-gray-500"></i>
            <span>{dislikes}</span>
          </div>
          <div className="flex items-center gap-1">
            <i className="fas fa-comment text-gray-500"></i>
            <span>{comments}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ReviewCard;
