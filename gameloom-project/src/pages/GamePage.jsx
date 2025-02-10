import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchGameDetails, fetchGameTimeToBeat } from "../../api";
import GameSticky from "../components/GamePage/GameSticky";
import GameDetails from "../components/GamePage/GameDetails";
import GameMedia from "../components/GamePage/GameMedia";

const GamePage = () => {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeToBeat, setTimeToBeat] = useState(null);

  useEffect(() => {
    async function getGameDetails() {
      setLoading(true);
      try {
        const data = await fetchGameDetails(gameId);
        if (data) {
          setGame(data);
          const timeToBeatData = await fetchGameTimeToBeat(gameId);
          setTimeToBeat(timeToBeatData);
        } else {
          setError("Game not found.");
        }
      } catch (err) {
        setError("Failed to load game details.");
      } finally {
        setLoading(false);
      }
    }
    getGameDetails();
  }, [gameId]);

  if (loading) return <div className="flex-center h-screen">Loading...</div>;
  if (error) return <div className="flex-center h-screen text-red-500">{error}</div>;
  if (!game) return <div className="flex-center h-screen">No game details found.</div>;

  const backgroundImage = game.screenshots?.length > 0 
    ? game.screenshots[0] 
    : game.coverImage;

  return (
    <div className="relative w-full">
      {/* Background Container */}
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 bg-cover bg-center brightness-[0.6] blur-xs"
          style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
      </div>

      {/* Content Section */}
      <div className="relative container mx-auto px-4 md:px-20 py-12 md:pt-12 grid grid-cols-1 md:grid-cols-[minmax(250px,350px)_1fr] gap-16 items-start">
        {/* Left Section */}
        <div className="w-full flex justify-center mb-8 md:mb-0 md:sticky md:top-20">
          <GameSticky coverImage={game.coverImage} name={game.name} />
        </div>

        {/* Right Section */}
        <div className="w-full max-w-3xl">
          <GameDetails game={game} timeToBeat={timeToBeat} trailer={game.videos[0]} />
          <GameMedia screenshots={game.screenshots} videos={game.videos} />
        </div>
      </div>
    </div>
  );
};

export default GamePage;
