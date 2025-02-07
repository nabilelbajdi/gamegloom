import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchGameDetails } from "../../api";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-300">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-300">No game details found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Hero Section with Cover Image */}
      <div className="relative h-96">
        <img
          src={game.cover?.url.replace("t_thumb", "t_1080p")}
          alt={game.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="absolute bottom-4 left-4 text-white">
          <h1 className="text-4xl font-bold">{game.name}</h1>
          <p className="mt-2">
            {game.first_release_date
              ? new Date(game.first_release_date * 1000).toLocaleDateString()
              : "Unknown Release Date"}
          </p>
        </div>
      </div>

      {/* Game Details Section */}
      <div className="mt-6 text-gray-300">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <p className="mb-4">{game.summary}</p>
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="font-bold">Genres:</span>{" "}
            {game.genres ? game.genres.map((g) => g.name).join(", ") : "N/A"}
          </div>
          <div>
            <span className="font-bold">Platforms:</span>{" "}
            {game.platforms ? game.platforms.map((p) => p.name).join(", ") : "N/A"}
          </div>
          <div>
            <span className="font-bold">Rating:</span>{" "}
            {game.rating ? (game.rating / 20).toFixed(1) : "N/A"}{" "}
            {game.total_rating_count ? `(${game.total_rating_count} reviews)` : ""}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">User Reviews</h2>
        <p className="text-gray-500">Reviews will be displayed here in future.</p>
      </div>
    </div>
  );
};

export default GamePage;
