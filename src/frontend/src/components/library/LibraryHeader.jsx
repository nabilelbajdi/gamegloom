import React from "react";

const LibraryHeader = () => {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/collage.jpg"
          alt="Library Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90"></div>
      </div>
      <div className="container mx-auto px-4 py-12 pt-20 relative z-10">
        <div className="text-center mx-auto mt-6">
          <h1 className="text-3xl md:text-4xl font-semibold text-[var(--text-primary)] mb-3">
            Game Library
          </h1>
          <p className="text-gray-300 text-base max-w-2xl mx-auto text-center">
            Your personal quest log for gaming—one place to track your progress, organize your collection, and keep your library in check.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LibraryHeader; 