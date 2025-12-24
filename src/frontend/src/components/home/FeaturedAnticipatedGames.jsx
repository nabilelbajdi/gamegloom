import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Clock, Flame, Bell, Monitor, Gamepad2, Smartphone } from "lucide-react";
import useGameStore from "../../store/useGameStore";
import { getUpcomingFeaturedGames, normalizePlatformName, getHighResImageUrl } from "../../utils/gameUtils";
import CountdownText from "../common/CountdownText";
import { format } from "date-fns";

// Function to format hype count
const formatHypeCount = (count) => {
  if (!count) return "0";
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

const FeaturedAnticipatedGames = () => {
  const { anticipatedGames, fetchGames, gameDetails, fetchGameDetails } = useGameStore();
  const [games, setGames] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Local interaction states
  const [hypedGames, setHypedGames] = useState({});
  const [notifiedGames, setNotifiedGames] = useState({});

  const ROTATION_DURATION = 8000; // 8 seconds per slide
  const UPDATE_INTERVAL = 100; // Update progress every 100ms

  useEffect(() => {
    if (!anticipatedGames || anticipatedGames.length === 0) {
      fetchGames("anticipated");
    }
  }, []);

  useEffect(() => {
    if (anticipatedGames && anticipatedGames.length > 0) {
      // Get top 4 games for the carousel
      const topGames = getUpcomingFeaturedGames(anticipatedGames, 4);
      setGames(topGames);
    }
  }, [anticipatedGames]);

  // Fetch full details for the active game to get high-res artworks/screenshots
  useEffect(() => {
    if (games.length > 0) {
      const activeGameId = games[activeIndex]?.id;
      // Safety check for gameDetails being defined
      if (activeGameId && (!gameDetails || !gameDetails[activeGameId])) {
        if (typeof fetchGameDetails === 'function') {
          fetchGameDetails(activeGameId);
        }
      }
    }
  }, [activeIndex, games, gameDetails, fetchGameDetails]);

  // Auto-rotation logic
  useEffect(() => {
    if (games.length <= 1) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (UPDATE_INTERVAL / ROTATION_DURATION) * 100;
        if (newProgress >= 100) {
          setActiveIndex((current) => (current + 1) % games.length);
          return 0;
        }
        return newProgress;
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(timer);
  }, [games.length, activeIndex]);

  // Reset progress when active index changes manually
  const handleGameSelect = (index) => {
    setActiveIndex(index);
    setProgress(0);
  };

  const handleHype = (gameId, currentHypes) => {
    setHypedGames(prev => ({
      ...prev,
      [gameId]: !prev[gameId]
    }));
  };

  const toggleNotify = (gameId) => {
    setNotifiedGames(prev => ({
      ...prev,
      [gameId]: !prev[gameId]
    }));
  };

  if (!games || games.length === 0) return null;

  const activeGameBasic = games[activeIndex];
  // Prefer detailed data if available (contains artworks/screenshots), otherwise fallback to basic
  const activeGame = gameDetails[activeGameBasic.id] || activeGameBasic;

  const isActiveHyped = hypedGames[activeGame.id];
  const isActiveNotified = notifiedGames[activeGame.id];

  // Calculate display hype count based on local interaction
  const displayHypeCount = (activeGame.hypes || 0) + (isActiveHyped ? 1 : 0);

  // Extract platforms ensuring it's an array of strings
  const platforms = Array.isArray(activeGame.platforms)
    ? activeGame.platforms
    : (typeof activeGame.platforms === 'string' ? activeGame.platforms.split(', ') : []);

  const releaseDate = new Date(activeGame.firstReleaseDate);
  const formattedDate = format(releaseDate, 'MMMM do, yyyy');

  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-[var(--bg-base)]" aria-labelledby="coming-soon-title">
      {/* Background texture/glow for Section */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-primary/5 rounded-full blur-[120px] opacity-50"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">

        {/* Section Header */}
        <header className="mb-8 md:mb-12 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-px bg-gradient-to-r from-primary to-transparent" />
            <span className="text-sm uppercase tracking-[0.3em] text-primary font-medium">
              On the Horizon
            </span>
          </div>
          <h2
            id="coming-soon-title"
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight"
          >
            Coming Soon
          </h2>
          <p className="text-lg text-light/60 max-w-xl">
            The most anticipated titles on their way. Be the first to play.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 lg:h-[500px]">

          {/* Main Hero Card (Active Game) */}
          <div className="lg:col-span-8 relative w-full h-[450px] lg:h-full overflow-hidden rounded-2xl md:rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-elevated-1)] shadow-2xl group">

            {/* Background Image */}
            <div className="absolute inset-0">
              {games.map((game, idx) => {
                const detailedGame = gameDetails[game.id];
                const displayImage = (detailedGame && (detailedGame.artworks?.[0]?.url || detailedGame.screenshots?.[0]?.url))
                  || game.artworks?.[0]?.url
                  || game.screenshots?.[0]?.url
                  || game.coverImage;

                return (
                  <img
                    key={game.id}
                    src={getHighResImageUrl(displayImage)}
                    alt={game.name}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${idx === activeIndex ? 'opacity-60 scale-[1.03]' : 'opacity-0 scale-100'
                      }`}
                  />

                );
              })}
              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-base)]/90 via-[var(--bg-base)]/40 to-transparent" />
            </div>

            {/* Content Container */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-12 z-10">
              <div className="max-w-3xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 key={activeGame.id}">

                {/* Title & Date */}
                <div className="space-y-3 overflow-hidden">
                  <h3 className="text-3xl md:text-4xl lg:text-6xl font-black text-white tracking-tight leading-none uppercase drop-shadow-lg truncate whitespace-nowrap" title={activeGame.name}>
                    {activeGame.name}
                  </h3>
                  <div className="flex items-center gap-2 text-primary/80 font-medium text-lg">
                    <Clock className="w-5 h-5" />
                    <span>Releasing {formattedDate}</span>
                  </div>
                </div>

                {/* Countdown */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-light/50">
                    <span className="text-sm uppercase tracking-widest font-medium">Launching in</span>
                  </div>
                  <CountdownText targetDate={activeGame.firstReleaseDate} />
                </div>

                {/* Integrated Stats & Platforms */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="flex items-center gap-2 text-light/80 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <Flame className={`w-4 h-4 ${isActiveHyped ? 'text-primary fill-primary' : 'text-light/70'}`} />
                    <span className="font-semibold text-white">{formatHypeCount(displayHypeCount)}</span>
                    <span className="text-sm opacity-70">players waiting</span>
                  </div>

                  {/* Platforms Text Tags */}
                  {platforms.length > 0 && (
                    <div className="flex items-center gap-2">
                      {platforms.map((platform, idx) => (
                        <span
                          key={idx}
                          className="text-xs font-semibold px-2.5 py-1 rounded bg-[var(--bg-elevated-2)] border border-[var(--border-subtle)] text-light/70 uppercase tracking-wide"
                        >
                          {normalizePlatformName(platform)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    onClick={() => handleHype(activeGame.id, activeGame.hypes)}
                    className={`group flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm md:text-base transition-all duration-300 shadow-md ${isActiveHyped
                      ? 'bg-primary text-black shadow-primary/20'
                      : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-black hover:shadow-primary/30'
                      }`}
                  >
                    <Flame className={`w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110 ${isActiveHyped ? 'fill-black' : 'fill-primary group-hover:fill-black'}`} />
                    {isActiveHyped ? 'Hyped' : 'Hype This'}
                  </button>

                  <button
                    onClick={() => toggleNotify(activeGame.id)}
                    className={`group flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-sm md:text-base transition-all duration-300 border ${isActiveNotified
                      ? 'bg-white text-black border-white'
                      : 'bg-[var(--bg-elevated-2)] text-light border-[var(--border-subtle)] hover:bg-white hover:text-black hover:border-white'
                      }`}
                  >
                    <Bell className={`w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110 ${isActiveNotified ? 'fill-black' : ''}`} />
                    {isActiveNotified ? 'Notified' : 'Notify Me'}
                  </button>

                  <Link
                    to={`/game/${activeGame.slug || activeGame.igdb_id}`}
                    className="flex items-center gap-2 px-5 py-3.5 text-light/60 hover:text-white transition-colors font-medium ml-1"
                  >
                    Details
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Side Queue (Up Next) */}
          <div className="lg:col-span-4 flex flex-col gap-3 h-full overflow-hidden">
            {games.map((game, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={game.id}
                  onClick={() => handleGameSelect(index)}
                  className={`relative w-full text-left p-3 rounded-xl transition-all duration-300 border group overflow-hidden ${isActive
                    ? 'bg-[var(--bg-elevated-2)] border-[var(--border-subtle)] ring-1 ring-primary/20'
                    : 'bg-transparent border-transparent hover:bg-[var(--bg-elevated-1)] hover:border-[var(--border-subtle)]'
                    }`}
                >
                  <div className="flex gap-4 items-center relative z-10">
                    {/* Thumbnail */}
                    <div className="relative w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-black/50 shadow-sm">
                      <img
                        src={game.coverImage}
                        alt={game.name}
                        className={`w-full h-full object-cover transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0'}`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm md:text-base font-bold truncate transition-colors ${isActive ? 'text-white' : 'text-light/70 group-hover:text-white'}`}>
                        {game.name}
                      </h4>
                      <div className="text-xs text-light/50 mt-1 flex items-center gap-2">
                        <span>{format(new Date(game.firstReleaseDate), 'MMM d')}</span>
                        {isActive && <span className="text-primary font-medium flex items-center gap-1">• Active</span>}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar (Only for active item) */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 h-[3px] bg-primary/20 w-full">
                      <div
                        className="h-full bg-primary transition-all duration-100 ease-linear shadow-[0_0_10px_theme(colors.primary.DEFAULT)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedAnticipatedGames;