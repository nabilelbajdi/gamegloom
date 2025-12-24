// src/pages/GamePage.jsx
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import useGameStore from "../store/useGameStore";
import useUserGameStore from "../store/useUserGameStore";
import GameSticky from "../components/GamePage/GameSticky";
import GameDetails from "../components/GamePage/GameDetails";
import GameMedia from "../components/GamePage/GameMedia";
import SimilarGames from "../components/GamePage/SimilarGames";
import RelatedContent from "../components/GamePage/RelatedContent";
import ReviewList from "../components/reviews/ReviewList";

// Loading Skeleton Component
const GamePageSkeleton = () => {
  return (
    <div className="relative w-full">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gray-900 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 md:px-20 py-8 md:py-8 grid grid-cols-1 md:grid-cols-[minmax(280px,320px)_1fr] gap-16 items-start">
        {/* Game Cover Sticky Section */}
        <div className="w-full flex justify-center mb-8 md:mb-0 md:sticky md:top-20">
          {/* GameSticky Skeleton */}
          <div className="w-full max-w-[280px]">
            <div className="aspect-[264/374] rounded-xl bg-gray-800 animate-pulse mb-4"></div>
            <div className="h-10 bg-gray-800 animate-pulse rounded-lg mb-3"></div>
            <div className="h-10 bg-gray-800/50 animate-pulse rounded-lg mb-5"></div>
            <div className="space-y-2">
              <div className="h-5 bg-gray-800/40 animate-pulse rounded w-3/4"></div>
              <div className="h-5 bg-gray-800/40 animate-pulse rounded w-1/2"></div>
              <div className="h-5 bg-gray-800/40 animate-pulse rounded w-2/3"></div>
            </div>
          </div>
        </div>

        {/* Game Details Section */}
        <div className="w-full max-w-3xl">
          {/* GameDetails Skeleton */}
          <div className="pt-6 md:pt-12">
            {/* Game Title */}
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="h-8 bg-gray-800 animate-pulse rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-800/50 animate-pulse rounded w-1/2"></div>
              </div>
              <div className="flex-shrink-0">
                <div className="h-10 w-16 bg-gray-800/40 animate-pulse rounded"></div>
              </div>
            </div>
            
            {/* Separator */}
            <div className="container mx-auto my-2 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
            
            {/* Media Preview */}
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-2">
                {/* Main Trailer */}
                <div className="aspect-video bg-gray-800/40 animate-pulse rounded-lg"></div>
                
                {/* Screenshots column */}
                <div className="hidden md:flex flex-col gap-2">
                  <div className="aspect-video bg-gray-800/30 animate-pulse rounded-lg"></div>
                  <div className="aspect-video bg-gray-800/30 animate-pulse rounded-lg"></div>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div className="mt-4">
              <div className="h-5 bg-gray-800/40 animate-pulse rounded w-1/4 mb-2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-800/30 animate-pulse rounded w-full"></div>
                <div className="h-3 bg-gray-800/30 animate-pulse rounded w-full"></div>
              </div>
            </div>
            
            {/* Genres */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-5 bg-gray-800/30 animate-pulse rounded-full w-16"></div>
              ))}
            </div>
            
            {/* Game Information */}
            <div className="mt-4 bg-surface-dark p-3 rounded-md border-[0.5px] border-gray-800/30">
              <div className="h-4 bg-gray-800/40 animate-pulse rounded w-1/5 mb-2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-800/30 animate-pulse rounded w-1/2"></div>
                <div className="h-3 bg-gray-800/30 animate-pulse rounded w-2/3"></div>
                <div className="h-3 bg-gray-800/30 animate-pulse rounded w-1/2"></div>
              </div>
            </div>
          </div>
          
          {/* ReviewList Skeleton */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-gray-800 animate-pulse rounded w-1/4"></div>
            </div>
            <div className="h-32 bg-surface-dark animate-pulse rounded-lg"></div>
            <div className="h-32 bg-surface-dark animate-pulse rounded-lg"></div>
          </div>
          
          {/* SimilarGames Skeleton */}
          <div className="mt-8">
            <div className="h-6 bg-gray-800 animate-pulse rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="aspect-[264/374] bg-gray-800/30 animate-pulse rounded"></div>
              ))}
            </div>
          </div>
          
          {/* RelatedContent Skeleton */}
          <div className="mt-8">
            <div className="h-6 bg-gray-800 animate-pulse rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="aspect-[264/374] bg-gray-800/30 animate-pulse rounded"></div>
              ))}
            </div>
          </div>
          
          {/* GameMedia Skeleton */}
          <div className="mt-8">
            <div className="h-6 bg-gray-800 animate-pulse rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="aspect-video bg-gray-800/30 animate-pulse rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GamePage = () => {
  const { gameId } = useParams();
  const { gameDetails, fetchGameDetails } = useGameStore();
  const { fetchCollection, collection } = useUserGameStore();
  const isLoggedIn = localStorage.getItem("token") !== null;
  
  const isNumericId = !isNaN(gameId);
  const game = isNumericId
    ? Object.values(gameDetails).find(g => g.igdb_id === parseInt(gameId))
    : Object.values(gameDetails).find(g => g.slug === gameId);

  useEffect(() => {
    // Always fetch game details
    fetchGameDetails(gameId);
    
    // Only fetch collection if the user is logged in
    if (isLoggedIn) {
      fetchCollection();
    }
  }, [fetchGameDetails, gameId, fetchCollection, isLoggedIn]);

  // Save recently viewed game
  useEffect(() => {
    if (game) {
      try {
        const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewedGames') || '[]');
        
        // Prepare simplified game object with essential info
        const gameToSave = {
          id: game.id || game.igdb_id,
          igdb_id: game.igdb_id,
          slug: game.slug,
          name: game.name,
          coverImage: game.coverImage
        };
        
        // Remove this game if it exists already (to move it to the front)
        const filteredGames = recentlyViewed.filter(g => g.id !== gameToSave.id && g.igdb_id !== gameToSave.igdb_id);
        
        // Add current game to the beginning - store up to 15 games
        const updatedGames = [gameToSave, ...filteredGames].slice(0, 15);
        
        // Save to localStorage
        localStorage.setItem('recentlyViewedGames', JSON.stringify(updatedGames));
      } catch (error) {
        console.error('Error saving recently viewed game:', error);
      }
    }
  }, [game]);
    
  if (!game) return <GamePageSkeleton />;

  // Function to convert screenshot URLs to high resolution (1080p)
  const getHighResImage = (url) => {
    if (!url || !url.includes('/t_')) return url;
    return url.replace(/\/t_[^/]+\//, '/t_1080p/');
  };

  // OPTION 3: Use the first artwork available
  const backgroundImage = game.artworks?.length > 0
    ? getHighResImage(game.artworks[0])
    : (game.screenshots?.length > 0
        ? getHighResImage(game.screenshots[Math.floor(Math.random() * game.screenshots.length)])
        : (game.coverImage ? getHighResImage(game.coverImage) : "/public/images/fallback.jpg"));

  return (
    <div className="relative w-full">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 bg-cover bg-center blur-md brightness-[0.8]"
          style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 md:px-20 py-8 md:py-8 grid grid-cols-1 md:grid-cols-[minmax(280px,320px)_1fr] gap-16 items-start">
        {/* Game Cover Sticky Section */}
        <div className="w-full flex justify-center mb-8 md:mb-0 md:sticky md:top-20">
          <GameSticky game={game} />
        </div>

        {/* Game Details Section */}
        <div className="w-full max-w-3xl">
          <GameDetails game={game} trailer={game.videos?.[0]} />
          <ReviewList gameId={game.igdb_id} releaseDate={game.firstReleaseDate} />
          <SimilarGames games={game.similarGames} />
          <RelatedContent 
            dlcs={game.dlcs}
            expansions={game.expansions}
            remakes={game.remakes}
            remasters={game.remasters}
            bundles={game.bundles}
            ports={game.ports}
            standalone_expansions={game.standalone_expansions}
            seasons={game.seasons}
            packs={game.packs}
            editions={game.editions}
          />
          <GameMedia screenshots={game.screenshots} videos={game.videos} artworks={game.artworks} />
        </div>
      </div>
    </div>
  );
};

export default GamePage;
