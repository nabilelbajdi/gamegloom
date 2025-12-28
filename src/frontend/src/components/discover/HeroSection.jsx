import React, { useState } from "react";
import { Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const HeroSection = ({
  featuredGame,
  genres = [],
  initialSearchQuery = ""
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const navigate = useNavigate();

  // Handle search submission - redirect to search page
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}&category=all`);
    }
  };

  // Handle keyboard input - submit on Enter
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Helper to get the best available high-resolution image
  const getHighResImage = (game) => {
    if (!game) return null;

    if (game.artworks && game.artworks.length > 0) {
      return game.artworks[0].replace('t_thumb', 't_1080p');
    }

    if (game.screenshots && game.screenshots.length > 0) {
      return game.screenshots[0].replace('t_thumb', 't_1080p');
    }

    if (game.backgroundImage) {
      return game.backgroundImage.replace('t_thumb', 't_1080p')
        .replace('t_cover_big', 't_1080p');
    }

    if (game.coverImage) {
      return game.coverImage.replace('t_thumb', 't_1080p')
        .replace('t_cover_big', 't_1080p');
    }

    return null;
  };

  const backgroundImage = getHighResImage(featuredGame);

  return (
    <section className="relative h-[500px] overflow-hidden">
      {/* Background Image - extends behind navbar */}
      <div className="absolute inset-0 z-0">
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt={featuredGame?.name || "Featured game background"}
            className="w-full h-full object-cover opacity-45"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-black/85 to-black/60" />
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-28">
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-md">
          Discover <span className="text-primary drop-shadow-lg">Games</span>
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-white/90 drop-shadow-sm font-medium">
          Explore the latest and greatest in gaming across all platforms
        </p>

        <form onSubmit={handleSearchSubmit} className="max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
            <input
              type="text"
              placeholder="Search games, franchises, genres..."
              className="w-full h-12 pl-12 pr-4 rounded-lg bg-surface-dark/70 backdrop-blur-sm text-light focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
        </form>

        {genres.length > 0 && (
          <div className="mt-5 max-w-2xl flex flex-wrap gap-2">
            {genres.slice(0, 7).map(genre => (
              <Link
                key={genre.slug}
                to={`/genre/${genre.slug}`}
                className="px-4 py-1.5 rounded-lg bg-surface-dark/70 backdrop-blur-sm text-sm text-white hover:text-white hover:bg-surface-dark/80 transition-all shadow-sm"
              >
                {genre.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection; 