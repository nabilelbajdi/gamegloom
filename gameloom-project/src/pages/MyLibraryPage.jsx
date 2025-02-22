import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useUserGameStore from "../store/useUserGameStore";
import GameGrid from "../components/common/GameGrid";

const LibraryPage = () => {
  const { user, loading } = useAuth();
  const { collection, fetchCollection, isLoading } = useUserGameStore();

  useEffect(() => {
    if (user) {
      fetchCollection();
    }
  }, [user]);

  // Redirect to login if not authenticated
  if (!loading && !user) {
    return <Navigate to="/login" />;
  }

  if (loading || isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Game Library</h1>

      {/* Want to Play Section */}
      {collection.want_to_play.length > 0 && (
        <GameGrid
          title="Want to Play"
          games={collection.want_to_play}
          loading={isLoading}
        />
      )}

      {/* Currently Playing Section */}
      {collection.playing.length > 0 && (
        <GameGrid
          title="Currently Playing"
          games={collection.playing}
          loading={isLoading}
        />
      )}

      {/* Played Section */}
      {collection.played.length > 0 && (
        <GameGrid
          title="Played"
          games={collection.played}
          loading={isLoading}
        />
      )}

      {/* Empty State */}
      {!collection.want_to_play.length && !collection.playing.length && !collection.played.length && (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-400">Your library is empty</h2>
          <p className="text-gray-500 mt-2">
            Start adding games to your library to keep track of what you want to play,
            are currently playing, or have already played.
          </p>
        </div>
      )}
    </div>
  );
};

export default LibraryPage; 