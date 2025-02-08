import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchGameDetails } from "../../api";
import GameHeader from "../components/GamePage/GameHeader";

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
    <div className="container mx-auto px-4 md:px-20 py-12">
      {/* Game Header */}
      <GameHeader game={game} />

      {/* Other components like GameInfo, MediaGallery, Reviews will be added later */}
    </div>
  );
};

export default GamePage;
