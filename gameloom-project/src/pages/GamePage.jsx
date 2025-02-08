import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchGameDetails } from "../../api";
import { Star, Calendar, Play, Bookmark, Flame, Users, List } from "lucide-react";

const GamePage = () => {
  const { gameId } = useParams();
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
    <div className="container mx-auto px-6 py-12 text-[var(--color-light)]">
      {/* Hero Section */}
      <div className="relative h-96">
        {game.coverImage && (
          <img src={game.coverImage} alt={game.name} className="w-full h-full object-cover brightness-50 rounded-lg" />
        )}
        <div className="absolute inset-0 flex-center flex-col text-center px-6">
          <h1 className="text-5xl font-bold">{game.name}</h1>
          <p className="mt-2 text-lg text-gray-400">
            <Calendar className="inline-block w-5 h-5 mr-1" /> {game.releaseDate}
          </p>
          <div className="mt-4 space-x-4">
            <button className="btn-hero flex items-center">
              <Bookmark className="w-5 h-5 mr-2" /> Add to Library
            </button>
            <button className="btn-hero bg-secondary flex items-center">
              <Play className="w-5 h-5 mr-2" /> Watch Trailer
            </button>
          </div>
        </div>
      </div>

      {/* Game Details */}
      <div className="mt-8">
        <h2 className="text-3xl font-semibold mb-4">Game Overview</h2>
        <p className="text-gray-300 mb-4">{game.storyline}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <p><strong>Genres:</strong> {game.genres}</p>
          <p><strong>Platforms:</strong> {game.platforms}</p>
          <p><strong>Developers:</strong> {game.developers}</p>
          <p><strong>Game Modes:</strong> {game.gameModes}</p>
          <p><strong>Player Perspective:</strong> {game.playerPerspectives}</p>
          <p><strong>Themes:</strong> {game.themes}</p>
          <p className="flex items-center">
            <Flame className="w-5 h-5 text-red-400 mr-2" /> <strong>Hype:</strong> {game.hypes}
          </p>
        </div>
      </div>

      {/* Similar Games */}
      {game.similarGames.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Similar Games</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {game.similarGames.map((gameId, index) => (
              <div key={index} className="p-4 bg-gray-800 rounded-lg text-center">
                <p className="text-gray-300">Game ID: {gameId}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
