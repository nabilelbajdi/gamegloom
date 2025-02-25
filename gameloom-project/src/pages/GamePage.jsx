// src/pages/GamePage.jsx
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import useGameStore from "../store/useGameStore";
import useUserGameStore from "../store/useUserGameStore";
import GameSticky from "../components/GamePage/GameSticky";
import GameDetails from "../components/GamePage/GameDetails";
import GameMedia from "../components/GamePage/GameMedia";
import SimilarGames from "../components/GamePage/SimilarGames";
import ReviewList from "../components/reviews/ReviewList";

const GamePage = () => {
  const { gameId } = useParams();
  const { gameDetails, fetchGameDetails, gameTimeToBeat, fetchGameTimeToBeat } = useGameStore();
  const { fetchCollection } = useUserGameStore();

  useEffect(() => {
    fetchGameDetails(parseInt(gameId));
    fetchGameTimeToBeat(parseInt(gameId));
    fetchCollection();
  }, [gameId]);

  // Find game by IGDB ID
  const game = Object.values(gameDetails).find(g => g.igdb_id === parseInt(gameId));
  if (!game) return <div className="flex-center h-screen">Loading...</div>;

  const backgroundImage = game.screenshots?.[0] || game.coverImage || "/public/images/fallback.jpg";

  return (
    <div className="relative w-full">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 bg-cover bg-center brightness-[0.6] blur-xs"
          style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 md:px-20 py-12 md:pt-12 grid grid-cols-1 md:grid-cols-[minmax(250px,350px)_1fr] gap-16 items-start">
        {/* Game Cover Sticky Section */}
        <div className="w-full flex justify-center mb-8 md:mb-0 md:sticky md:top-20">
          <GameSticky game={game} />
        </div>

        {/* Game Details Section */}
        <div className="w-full max-w-3xl">
          <GameDetails game={game} timeToBeat={gameTimeToBeat[gameId]} trailer={game.videos?.[0]} />
          <div className="container mx-auto my-2 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
          <ReviewList gameId={game.igdb_id} releaseDate={game.firstReleaseDate} />
          <div className="container mx-auto my-2 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
          <SimilarGames games={game.similarGames} />
          <GameMedia screenshots={game.screenshots} videos={game.videos} />
        </div>
      </div>
    </div>
  );
};

export default GamePage;
