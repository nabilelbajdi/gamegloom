import React from "react";

const StarRating = ({ rating, totalRatingCount, aggregatedRatingCount }) => {
  if (!rating || rating === "N/A") {
    return (
      <div className="flex items-center">
        <div className="text-gray-500 text-2xl flex">
          {[...Array(5)].map((_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
        <span className="text-base ml-2 text-gray-500">No ratings yet</span>
      </div>
    );
  }

  const numericRating = parseFloat(rating);
  const fullStars = Math.floor(numericRating);
  const decimalPart = numericRating - fullStars;
  const emptyStars = 5 - Math.ceil(numericRating);

  return (
    <div className="flex flex-col items-end">
      {/* Stars and numeric rating */}
      <div className="flex items-center">
        <div className="text-2xl flex">
          {[...Array(fullStars)].map((_, i) => (
            <span key={`full-${i}`} className="text-primary">★</span>
          ))}
          {decimalPart > 0 && (
            <span className="relative">
              <span className="text-gray-500">★</span>
              <span
                className="absolute top-0 left-0 text-primary overflow-hidden"
                style={{ width: `${decimalPart * 100}%` }}
              >
                ★
              </span>
            </span>
          )}
          {[...Array(emptyStars)].map((_, i) => (
            <span key={`empty-${i}`} className="text-gray-500">★</span>
          ))}
        </div>
        <span className="text-2xl ml-4">
          {rating}
          <span className="text-sm text-gray-400">/5.0</span>
        </span>
      </div>
      
      {/* Ratings counts below */}
      <div className="flex gap-4 mt-1 text-xs">
        {totalRatingCount > 0 && (
          <div className="flex items-center text-gray-400">
            <span className="font-semibold text-gray-300">{totalRatingCount.toLocaleString()}</span>
            <span className="ml-1">user ratings</span>
          </div>
        )}
        {aggregatedRatingCount > 0 && (
          <div className="flex items-center text-gray-400">
            <span className="font-semibold text-gray-300">{aggregatedRatingCount.toLocaleString()}</span>
            <span className="ml-1">critic ratings</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StarRating; 