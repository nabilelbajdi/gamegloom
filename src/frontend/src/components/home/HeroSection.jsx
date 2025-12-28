// src/components/home/HeroSection.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronDown, UserPlus, TrendingUp, MessageSquare, Gamepad, ChevronLeft, ChevronRight, BookMarked, Library, ListChecks, Search, X } from "lucide-react";
import useGameStore from "../../store/useGameStore";
import useToastStore from "../../store/useToastStore";
import Button from "../UI/Button";
import GameCardSimple from "../game/GameCardSimple";
import { useAuth } from "../../context/AuthContext";
import useUserGameStore from "../../store/useUserGameStore";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { motion, AnimatePresence } from "framer-motion";

// CSS for Quote Animation
const quoteAnimationStyle = {
  "@keyframes fadeIn": {
    "0%": { opacity: 0, transform: "translateY(10px)" },
    "100%": { opacity: 1, transform: "translateY(0)" }
  },
  "@keyframes fadeOut": {
    "0%": { opacity: 1, transform: "translateY(0)" },
    "100%": { opacity: 0, transform: "translateY(-10px)" }
  }
};

const HeroSection = () => {
  const navigate = useNavigate();
  const { highlyRatedGames, trendingGames, anticipatedGames, recommendedGames, fetchGames } = useGameStore();
  const { info } = useToastStore();
  const { user } = useAuth();
  const { fetchCollection } = useUserGameStore();
  const [featuredGames, setFeaturedGames] = useState([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState("");
  const [animationKey, setAnimationKey] = useState(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const sliderRef = useRef(null);
  const toastShownRef = useRef(false);

  // Show development notice toast once per session
  useEffect(() => {
    const bannerShown = sessionStorage.getItem('devToastShown');
    if (!bannerShown && !toastShownRef.current) {
      toastShownRef.current = true;
      sessionStorage.setItem('devToastShown', 'true');
      setTimeout(() => {
        info("GameGloom is under development. Some features may be limited.", { duration: 6000 });
      }, 2000);
    }
  }, []);

  // Famous game quotes - most iconic and widely recognized
  const gameQuotes = [
    { quote: "It's-a me, Mario!", source: "Super Mario 64" },
    { quote: "War. War never changes.", source: "Fallout" },
    { quote: "The cake is a lie.", source: "Portal" },
    { quote: "It's dangerous to go alone! Take this.", source: "The Legend of Zelda" },
    { quote: "Finish him!", source: "Mortal Kombat" },
    { quote: "Would you kindly?", source: "BioShock" },
    { quote: "Hey! Listen!", source: "The Legend of Zelda: Ocarina of Time" },
    { quote: "Get over here!", source: "Mortal Kombat" },
    { quote: "The right man in the wrong place can make all the difference.", source: "Half-Life 2" },
    { quote: "I used to be an adventurer like you, then I took an arrow to the knee.", source: "Skyrim" },
    { quote: "Do a barrel roll!", source: "Star Fox 64" },
    { quote: "Snake? Snake?! SNAAAAKE!", source: "Metal Gear Solid" },
    { quote: "You Died.", source: "Dark Souls" },
    { quote: "Did I ever tell you the definition of insanity?", source: "Far Cry 3" },
    { quote: "A man chooses, a slave obeys.", source: "BioShock" }
  ];

  // Cycle through quotes
  useEffect(() => {
    if (user) {
      const quoteInterval = setInterval(() => {
        setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % gameQuotes.length);
      }, 6000);

      return () => clearInterval(quoteInterval);
    }
  }, [user, gameQuotes.length]);

  useEffect(() => {
    // Fetch appropriate games based on login status
    if (!highlyRatedGames || highlyRatedGames.length === 0) {
      fetchGames("highlyRated");
    }
    if (!trendingGames || trendingGames.length === 0) {
      fetchGames("trending");
    }
    if (!anticipatedGames || anticipatedGames.length === 0) {
      fetchGames("anticipated");
    }

    // Only fetch recommendations for logged-in users
    if (user && (!recommendedGames || recommendedGames.length === 0)) {
      fetchGames("recommendations");
    }
  }, [highlyRatedGames, trendingGames, anticipatedGames, recommendedGames, fetchGames, user]);

  useEffect(() => {
    // Different game selection logic based on login status
    if (featuredGames.length === 0) {
      if (user && recommendedGames?.length > 0) {
        // For logged-in users with recommendations
        const validRecommendedGames = recommendedGames
          .filter(game => game && game.igdb_id && game.name && (game.coverImage || game.cover_image));

        if (validRecommendedGames.length > 0) {
          const selectedGames = validRecommendedGames.slice(0, 10);
          setFeaturedGames(selectedGames);
          updateBackgroundImage(selectedGames[0]);
          document.documentElement.style.setProperty('--carousel-duration', `${sliderSettings.autoplaySpeed}ms`);
        } else {
          selectRandomHighlyRatedGames();
        }
      } else if (highlyRatedGames?.length > 0 && trendingGames?.length > 0 && anticipatedGames?.length > 0) {
        // For non-logged-in users
        selectRandomHighlyRatedGames();
      }
    }
  }, [highlyRatedGames, trendingGames, anticipatedGames, recommendedGames, featuredGames.length, user]);

  const selectRandomHighlyRatedGames = () => {
    // Get valid games from all lists
    const validHighlyRated = highlyRatedGames
      .slice(0, 20)
      .filter(game => game && game.igdb_id && game.name && (game.coverImage || game.cover_image));

    const validTrending = trendingGames
      .slice(0, 20)
      .filter(game => game && game.igdb_id && game.name && (game.coverImage || game.cover_image));

    const validAnticipated = anticipatedGames
      .slice(0, 20)
      .filter(game => game && game.igdb_id && game.name && (game.coverImage || game.cover_image));

    // Combine all lists
    const combinedGames = [...validHighlyRated, ...validTrending, ...validAnticipated];

    if (combinedGames.length > 0) {
      const selectedGames = [];
      const gamesCopy = [...combinedGames];

      const numGamesToSelect = Math.min(10, gamesCopy.length);

      for (let i = 0; i < numGamesToSelect; i++) {
        const randomIndex = Math.floor(Math.random() * gamesCopy.length);
        selectedGames.push(gamesCopy[randomIndex]);
        gamesCopy.splice(randomIndex, 1);
      }

      setFeaturedGames(selectedGames);
      updateBackgroundImage(selectedGames[0]);
      document.documentElement.style.setProperty('--carousel-duration', `${sliderSettings.autoplaySpeed}ms`);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCollection();
    }
  }, [user, fetchCollection]);

  const updateBackgroundImage = (game) => {
    if (!game) return;

    if (game.artworks && game.artworks.length > 0) {
      setBackgroundImage(game.artworks[0]);
    } else if (game.screenshots && game.screenshots.length > 0) {
      setBackgroundImage(game.screenshots[0]);
    } else if (game.coverImage || game.cover_image) {
      setBackgroundImage(game.coverImage || game.cover_image);
    }
  };

  const handleGameClick = (game) => {
    if (game) {
      navigate(`/games/${game.id}`);
    }
  };

  const handleBeforeChange = (oldIndex, newIndex) => {
    setCurrentGameIndex(newIndex);
    updateBackgroundImage(featuredGames[newIndex]);
    setAnimationKey(prevKey => prevKey + 1);
  };

  const handlePrevClick = () => {
    sliderRef.current.slickPrev();
    setAnimationKey(prevKey => prevKey + 1);
  };

  const handleNextClick = () => {
    sliderRef.current.slickNext();
    setAnimationKey(prevKey => prevKey + 1);
  };

  const handleGoToSlide = (index) => {
    sliderRef.current.slickGoTo(index);
    setAnimationKey(prevKey => prevKey + 1);
  };

  const scrollToContent = () => {
    // Scroll to the "coming soon" section
    const comingSoonSection = document.getElementById("coming-soon") || document.querySelector(".coming-soon");
    if (comingSoonSection) {
      comingSoonSection.scrollIntoView({ behavior: "smooth" });
    } else {
      // Fallback to scroll down a fixed amount if section doesn't exist
      window.scrollTo({
        top: window.innerHeight,
        behavior: "smooth"
      });
    }
  };

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    beforeChange: handleBeforeChange,
    autoplay: true,
    autoplaySpeed: 5000,
    fade: true,
    pauseOnHover: false
  };

  // Different features based on login status
  const features = user ? [
    {
      icon: <ListChecks className="w-4 h-4" />,
      title: "Track Progress",
      description: "Manage your gaming backlog"
    },
    {
      icon: <Library className="w-4 h-4" />,
      title: "Your Library",
      description: "Build your gaming collection"
    },
    {
      icon: <BookMarked className="w-4 h-4" />,
      title: "Get Recommendations",
      description: "Find your next favorite game"
    }
  ] : [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      title: "Track Trending Games",
      description: "Stay updated with the hottest releases"
    },
    {
      icon: <MessageSquare className="w-4 h-4" />,
      title: "Join Discussions",
      description: "Share your thoughts with the community"
    },
    {
      icon: <Gamepad className="w-4 h-4" />,
      title: "Build Your Library",
      description: "Organize and track your game collection"
    }
  ];

  return (
    <section className="relative h-screen w-full flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {backgroundImage ? (
          <motion.img
            src={backgroundImage}
            alt="Hero background"
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          />
        ) : (
          <div className="w-full h-full bg-gray-900"></div>
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/90 to-transparent" />
      </div>

      <div className="relative container mx-auto px-3 w-full">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          {/* Left Side Content - Clean Search Hero */}
          <div className="space-y-8 py-8">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              {/* Personalized Greeting (logged in) or Marketing Copy (logged out) */}
              {user ? (
                <motion.p
                  className="text-primary text-sm font-medium tracking-wide uppercase"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Welcome back, {user.username}
                </motion.p>
              ) : (
                <motion.p
                  className="text-light/60 text-sm font-light tracking-wide"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Track • Discover • Connect
                </motion.p>
              )}

              {/* Main Headline */}
              <h1 className="text-4xl md:text-6xl font-bold text-light leading-tight">
                {user ? (
                  <>
                    Find Your
                    <br />
                    Next Adventure
                  </>
                ) : (
                  <>
                    Your Ultimate
                    <br />
                    Gaming Companion
                  </>
                )}
              </h1>

              {/* Search Bar */}
              <div className="relative group">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search 200,000+ games..."
                    className="w-full bg-transparent border-none outline-none text-2xl md:text-3xl text-light placeholder-light/40 py-4 pr-12 font-light tracking-wide transition-all duration-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        navigate(`/search?query=${encodeURIComponent(e.target.value)}&category=all`);
                      }
                    }}
                  />
                  <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 text-light/40 group-hover:text-primary transition-colors" />
                </div>

                {/* Animated Gradient Underline */}
                <div className="relative h-0.5 mt-2 bg-gradient-to-r from-light/20 to-light/5 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-secondary origin-left"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Dynamic Content: Quote (logged in) or Sign Up CTA (logged out) */}
              {user ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuoteIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.6 }}
                    className="border-l-2 border-primary/40 pl-4"
                  >
                    <p className="text-light/90 text-base md:text-lg italic font-light leading-relaxed">
                      "{gameQuotes[currentQuoteIndex].quote}"
                    </p>
                    <p className="text-primary/80 text-xs mt-2 font-medium">
                      — {gameQuotes[currentQuoteIndex].source}
                    </p>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <motion.div
                  className="flex items-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.9 }}
                >
                  <Link
                    to="/signup"
                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-primary/20"
                  >
                    Sign Up Free
                  </Link>
                  <p className="text-light/60 text-sm">
                    Join 10,000+ gamers tracking their library
                  </p>
                </motion.div>
              )}

              {/* Subtle Stats */}
              <motion.p
                className="text-sm text-light/50 font-light tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 1.1 }}
              >
                200,000+ games • Updated daily • Powered by IGDB
              </motion.p>
            </motion.div>
          </div>

          {/* Right Side - Featured Games Carousel */}
          <motion.div
            className="relative hidden md:block"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <div className="w-full max-w-sm mx-auto px-4 pt-8">
              {featuredGames.length > 0 ? (
                <div className="relative">

                  <Slider ref={sliderRef} {...sliderSettings}>
                    {featuredGames.map((game) => (
                      <div key={game.id} className="px-2">
                        <GameCardSimple game={game} />
                      </div>
                    ))}
                  </Slider>

                  {/* Navigation Arrows */}
                  <div className="flex justify-between absolute top-1/2 -left-8 -right-8 -translate-y-1/2 pointer-events-none">
                    <motion.button
                      onClick={handlePrevClick}
                      className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white pointer-events-auto cursor-pointer"
                      aria-label="Previous game"
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(0, 0, 0, 0.7)" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                      onClick={handleNextClick}
                      className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white pointer-events-auto cursor-pointer"
                      aria-label="Next game"
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(0, 0, 0, 0.7)" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </motion.button>
                  </div>

                  {/* Carousel Indicators */}
                  <div className="flex justify-center mt-4 gap-2">
                    {featuredGames.map((_, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleGoToSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${currentGameIndex === index ? "bg-primary w-4" : "bg-white/50"
                          }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1 bg-dark/50 mt-4 rounded-full overflow-hidden">
                    <div
                      key={animationKey}
                      className={`h-full bg-primary origin-left animate-progress ${sliderSettings.autoplay ? 'animate-progress-running' : 'animate-progress-paused'
                        }`}
                      style={{ animationDuration: 'var(--carousel-duration)' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="animate-pulse">
                  <div className="w-full aspect-[3/4] bg-surface-dark rounded-lg"></div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center cursor-pointer"
        onClick={scrollToContent}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 2 }}
        whileHover={{ y: 5 }}
      >
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
        >
          <ChevronDown className="h-5 w-5 text-white/60" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;