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
    
  if (!game) return <div className="flex-center h-screen">Loading...</div>;

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
