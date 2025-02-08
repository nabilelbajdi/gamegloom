import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchGameDetails } from "../../api";
import GameHero from "../components/GamePage/GameHero";

const GamePage = () => {
  const { gameId } = useParams(); // Get gameId from URL
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function getGameDetails() {
      setLoading(true);
      try {
        const data = await fetchGameDetails(gameId);
        if (data) {
          setGame(data);
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

  return (
    <div className="w-full">
      {/* Game Hero - Full width section */}
      <GameHero game={game} />

      {/* Content with container */}
      <div className="container mx-auto px-4 md:px-20 py-12">
        {/* Other game details/components */}
      </div>
    </div>
  );
};

export default GamePage;
