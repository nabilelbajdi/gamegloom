import React from "react";

const StarRating = ({ rating, totalRatingCount, aggregatedRatingCount }) => {
  // Helper function to format numbers (1200 -> 1.2k)
  const formatNumber = (num) => {
    if (!num) return "0";
    if (num < 1000) return num.toString();
    const thousands = num / 1000;
    return thousands % 1 === 0 
      ? `${thousands}k` 
      : `${thousands.toFixed(1).replace(/\.0$/, '')}k`;
  };

  if (!rating || rating === "N/A") {
    return (
      <div className="flex items-center">
        <div className="text-gray-500 text-3xl flex">
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
    <div className="pt-1">
      {/* Stars and numeric rating */}
      <div className="flex items-center">
        <div className="text-3xl flex gap-1">
          {[...Array(fullStars)].map((_, i) => (
            <span key={`full-${i}`} className="text-primary scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">★</span>
          ))}
          {decimalPart > 0 && (
            <span className="relative">
              <span className="text-gray-500">★</span>
              <span
                className="absolute top-0 left-0 text-primary overflow-hidden scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
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
        <div className="flex items-baseline ml-3">
          <span className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]">
            {Number(rating).toFixed(1)}
          </span>
          <span className="text-sm text-gray-500 ml-1">/5</span>
        </div>
      </div>
      
      {/* Ratings counts */}
      <div className="flex justify-end gap-4 mt-1 text-sm">
        {totalRatingCount > 0 && (
          <div className="flex items-center text-gray-400">
            <span className="font-semibold text-gray-300">{formatNumber(totalRatingCount)}</span>
            <span className="ml-1">ratings</span>
          </div>
        )}
        {aggregatedRatingCount > 0 && (
          <div className="flex items-center text-gray-400">
            <span className="font-semibold text-gray-300">{formatNumber(aggregatedRatingCount)}</span>
            <span className="ml-1">critics</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StarRating; 