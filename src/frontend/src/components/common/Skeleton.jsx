// src/components/common/Skeleton.jsx
import React from "react";

// Base shimmer block. Compose these for any skeleton.
export const Skeleton = ({ className = "" }) => (
  <div className={`bg-gray-800 rounded animate-pulse ${className}`} />
);

// A single game-card placeholder; mirrors GridGameCard's shape (cover + title + meta).
export const GameCardSkeleton = () => (
  <div className="block group relative overflow-hidden rounded-lg bg-surface">
    <Skeleton className="aspect-[3/4] w-full rounded-md" />
    <div className="p-3 bg-surface-dark">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2 mb-2" />
      <Skeleton className="h-3 w-8" />
    </div>
  </div>
);

// Responsive grid of card skeletons; columns mirror GameGrid's defaults.
export const CardGridSkeleton = ({ count = 12 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <GameCardSkeleton key={i} />
    ))}
  </div>
);

// List-row skeletons; mirrors GameListCard's shape.
export const ListSkeleton = ({ count = 8 }) => (
  <div className="overflow-hidden">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-stretch border-b border-gray-700/20 last:border-b-0 py-2"
      >
        <Skeleton className="w-16 md:w-20 aspect-[3/4]" />
        <div className="flex-1 p-3">
          <Skeleton className="h-4 w-1/3 mb-3" />
          <div className="flex gap-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Carousel loading row: title header + a row of card skeletons.
export const CarouselSkeleton = ({ title, slidesToShow = 5 }) => (
  <section className="mt-4">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-light">{title}</h2>
    </div>
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${slidesToShow}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: slidesToShow }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  </section>
);
