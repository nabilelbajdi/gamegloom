import React from "react";

const LoadingState = () => {
  return (
    <div className="min-h-screen bg-dark pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-800 rounded-lg w-1/3 mx-auto"></div>
          <div className="h-8 bg-gray-800 rounded w-2/3 mx-auto"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {[...Array(12)].map((_, index) => (
              <div key={index} className="aspect-[3/4] bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState; 