import React, { useState } from "react";
import { ShoppingCart, PlusCircle } from "lucide-react";

const GameSticky = ({ coverImage, name }) => {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (rating) => {
    setUserRating(rating === userRating ? 0 : rating);
  };

  const handleStarMouseEnter = (rating) => {
    setHoverRating(rating);
  };

  const handleStarMouseLeave = () => {
    setHoverRating(0);
  };

  return (
    <div className="sticky top-20 self-start w-64 sm:w-52 md:w-64 sm:py-6 mt-24 sm:mt-0 flex flex-col items-center">
      <img
        src={coverImage}
        alt={name}
        className="w-full rounded-lg shadow-md object-cover"
      />

      <div className="mt-4 w-full flex flex-col space-y-2">
        <button className="btn-nav w-full flex items-center gap-2 justify-center text-sm py-2">
          <PlusCircle className="w-4 h-4" /> Add to Library
        </button>
        <button className="btn-nav w-full flex items-center gap-2 justify-center text-sm py-2">
          <ShoppingCart className="w-4 h-4" /> Buy Now
        </button>
      </div>

      {/* Rate Game Section */}
      <div className="mt-4 w-full flex flex-col items-center">
        <span className="text-gray-400 text-xs">Rate this game</span>
        <div className="flex items-center mt-1 text-yellow-400 text-2xl">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`w-6 h-6 cursor-pointer ${
                star <= (hoverRating || userRating) ? "text-yellow-400" : "text-gray-400"
              }`}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarMouseEnter(star)}
              onMouseLeave={handleStarMouseLeave}
            >
              ★
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameSticky;
