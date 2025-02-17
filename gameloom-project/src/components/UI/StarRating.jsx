import React from "react";

const StarRating = ({ rating, totalRatingCount }) => {
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
      {totalRatingCount > 0 && (
        <span className="text-sm ml-2 mt-1 text-gray-400">
          ({totalRatingCount.toLocaleString()} Ratings)
        </span>
      )}
    </div>
  );
};

export default StarRating; 