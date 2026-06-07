import React from "react";
import { CardGridSkeleton } from "../common/Skeleton";

const LoadingState = () => {
  return (
    <div className="min-h-screen bg-dark pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          <div className="h-12 bg-gray-800 rounded-lg w-1/3 mx-auto animate-pulse"></div>
          <div className="h-8 bg-gray-800 rounded w-2/3 mx-auto animate-pulse"></div>
          <CardGridSkeleton count={12} />
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
