import React, { useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import useUserGameStore from "../store/useUserGameStore";
import GameGrid from "../components/common/GameGrid";
import GameCarousel from "../components/common/GameCarousel";

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

  const EmptyCard = () => (
    <Link 
      to="/discover"
      className="block aspect-[3/4] bg-surface/50 rounded-lg transition-colors hover:bg-surface/70"
    >
      <div className="h-full flex flex-col items-center justify-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
          <Plus className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <h3 className="text-gray-200 font-medium">Add Games</h3>
          <p className="text-gray-400 text-sm mt-1">
            Browse our collection
          </p>
        </div>
      </div>
    </Link>
  );

  const renderGameSection = (title, games, path) => {
    const titleContent = `${title} (${games.length})`;

    if (games.length === 0) {
      return (
        <GameGrid
          title={titleContent}
          games={[]}
          loading={false}
          emptyContent={<EmptyCard />}
        />
      );
    }

    if (games.length > 6) {
      return (
        <GameCarousel
          title={titleContent}
          games={games}
          maxGames={12}
          slidesToShow={6}
        />
      );
    }

    return (
      <GameGrid
        title={titleContent}
        games={games}
        loading={isLoading}
      />
    );
  };

  return (
    <div className="w-full">
      {/* Banner Section */}
      <div className="w-full bg-surface pt-16 md:pt-24 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">My Game Library</h1>
          <p className="text-gray-400 mt-2">
            Keep track of your game collection and progress.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        {renderGameSection("Want to Play", collection.want_to_play)}
        {renderGameSection("Currently Playing", collection.playing)}
        {renderGameSection("Played", collection.played)}
      </div>
    </div>
  );
};

export default LibraryPage; 