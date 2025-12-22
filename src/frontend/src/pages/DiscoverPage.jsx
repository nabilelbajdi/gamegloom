import React, { useState, useEffect } from "react";
import useGameStore from "../store/useGameStore";
import GenreCarousel from "../components/discover/GenreCarousel";
import HeroSection from "../components/discover/HeroSection";
import GameOfTheYear from "../components/discover/GameOfTheYear";
import MostAnticipatedGame from "../components/discover/MostAnticipatedGame";
import TrendingGames from "../components/home/TrendingGames";
import GameListSection from "../components/discover/GameListSection";

const DiscoverPage = () => {
  const { fetchTopGamesForGenre, fetchTopGamesForTheme, fetchGames, highlyRatedGames } = useGameStore();
  const [genreGames, setGenreGames] = useState({});
  const [themeGames, setThemeGames] = useState({});
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [loadingHighlyRated, setLoadingHighlyRated] = useState(true);
  const [featuredGame, setFeaturedGame] = useState(null);

  const genres = [
    { title: "Adventure", slug: "adventure" },
    { title: "RPG", slug: "rpg" },
    { title: "Shooter", slug: "shooter" },
    { title: "Strategy", slug: "strategy" },
    { title: "Platform", slug: "platform" },
    { title: "Puzzle", slug: "puzzle" },
    { title: "Racing", slug: "racing" },
    { title: "Fighting", slug: "fighting" },
    { title: "Indie", slug: "indie" },
    { title: "Simulator", slug: "simulator" },
    { title: "Sport", slug: "sport" },
    { title: "Arcade", slug: "arcade" },
    { title: "Card & Board", slug: "card" },
    { title: "Visual Novel", slug: "visual-novel" },
    { title: "MOBA", slug: "moba" },
    { title: "Tactical", slug: "tactical" }
  ];

  const themes = [
    { title: "Action", slug: "action" },
    { title: "Fantasy", slug: "fantasy" },
    { title: "Sci-Fi", slug: "science-fiction" },
    { title: "Horror", slug: "horror" },
    { title: "Thriller", slug: "thriller" },
    { title: "Survival", slug: "survival" },
    { title: "Historical", slug: "historical" },
    { title: "Stealth", slug: "stealth" },
    { title: "Comedy", slug: "comedy" },
    { title: "Business", slug: "business" },
    { title: "Drama", slug: "drama" },
    { title: "Mystery", slug: "mystery" },
    { title: "Educational", slug: "educational" },
    { title: "Kids", slug: "kids" },
    { title: "Open World", slug: "open-world" },
    { title: "Warfare", slug: "warfare" }
  ];

  useEffect(() => {
    const fetchInitialGenres = async () => {
      setLoadingGenres(true);
      const results = {};

      // Fetch data for the first 4 genres (ones that will be initially visible)
      for (let i = 0; i < 4; i++) {
        if (i < genres.length) {
          const games = await fetchTopGamesForGenre(genres[i].slug, 3);
          results[genres[i].slug] = games;
        }
      }

      setGenreGames(results);
      setLoadingGenres(false);
    };

    fetchInitialGenres();
  }, [fetchTopGamesForGenre]);

  useEffect(() => {
    const fetchInitialThemes = async () => {
      setLoadingThemes(true);
      const results = {};

      // Fetch data for the first 4 themes (ones that will be initially visible)
      for (let i = 0; i < 4; i++) {
        if (i < themes.length) {
          const games = await fetchTopGamesForTheme(themes[i].slug, 3);
          results[themes[i].slug] = games;
        }
      }

      setThemeGames(results);
      setLoadingThemes(false);
    };

    fetchInitialThemes();
  }, [fetchTopGamesForTheme]);

  useEffect(() => {
    const fetchHighlyRatedGamesData = async () => {
      setLoadingHighlyRated(true);
      await fetchGames("highlyRated");
      setLoadingHighlyRated(false);
    };

    fetchHighlyRatedGamesData();
  }, [fetchGames]);

  // Set a featured game when highly rated games are loaded
  useEffect(() => {
    if (highlyRatedGames && highlyRatedGames.length > 0 && !featuredGame) {
      const gamesWithArtwork = highlyRatedGames.filter(
        game => (game.artworks && game.artworks.length > 0) ||
          (game.screenshots && game.screenshots.length > 0)
      );

      // Use games with artwork if available, otherwise use all highly rated games
      const gamePool = gamesWithArtwork.length > 0 ? gamesWithArtwork : highlyRatedGames;

      // Select a random game from the pool
      const randomGame = gamePool[Math.floor(Math.random() * gamePool.length)];
      setFeaturedGame(randomGame);
    }
  }, [highlyRatedGames, featuredGame]);

  const handleGenreSlideChange = async (currentSlide) => {
    const startIdx = currentSlide * 4;
    const endIdx = Math.min(startIdx + 4, genres.length);

    for (let i = startIdx; i < endIdx; i++) {
      const genreSlug = genres[i].slug;

      if (!genreGames[genreSlug] || genreGames[genreSlug].length === 0) {
        const games = await fetchTopGamesForGenre(genreSlug, 3);
        setGenreGames(prev => ({
          ...prev,
          [genreSlug]: games
        }));
      }
    }
  };

  const handleThemeSlideChange = async (currentSlide) => {
    const startIdx = currentSlide * 4;
    const endIdx = Math.min(startIdx + 4, themes.length);

    for (let i = startIdx; i < endIdx; i++) {
      const themeSlug = themes[i].slug;

      if (!themeGames[themeSlug] || themeGames[themeSlug].length === 0) {
        const games = await fetchTopGamesForTheme(themeSlug, 3);
        setThemeGames(prev => ({
          ...prev,
          [themeSlug]: games
        }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      {/* Hero Section Component */}
      <HeroSection
        featuredGame={featuredGame}
        genres={genres}
      />

      {/* Main content */}
      <div className="flex-1 bg-[var(--bg-base)] pb-12">
        <div className="container mx-auto px-4">
          {/* Trending Games Carousel */}
          <TrendingGames />
        </div>

        {/* Game of the Year 2024 Feature */}
        <GameOfTheYear />

        <div className="container mx-auto px-4">
          {/* Genre Carousel */}
          <GenreCarousel
            title="Popular Genres"
            categories={genres}
            games={genreGames}
            viewAllLink="/genres"
            type="genre"
            loading={loadingGenres}
            onSlideChange={handleGenreSlideChange}
          />
        </div>

        {/* Most Anticipated Game Feature */}
        <MostAnticipatedGame />

        <div className="container mx-auto px-4">
          {/* Theme Carousel */}
          <GenreCarousel
            title="Popular Themes"
            categories={themes}
            games={themeGames}
            viewAllLink="/themes"
            type="theme"
            loading={loadingThemes}
            onSlideChange={handleThemeSlideChange}
          />

          {/* Game Lists Section */}
          <GameListSection />
        </div>
      </div>
    </div>
  );
};

export default DiscoverPage;