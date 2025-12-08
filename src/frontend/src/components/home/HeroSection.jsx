// src/components/home/HeroSection.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, UserPlus, TrendingUp, MessageSquare, Gamepad, ChevronLeft, ChevronRight, BookMarked, Library, ListChecks, Search, X } from "lucide-react";
import useGameStore from "../../store/useGameStore";
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
  const { user } = useAuth();
  const { fetchCollection } = useUserGameStore();
  const [featuredGames, setFeaturedGames] = useState([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState("");
  const [animationKey, setAnimationKey] = useState(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [showDevBanner, setShowDevBanner] = useState(false);
  const sliderRef = useRef(null);

  // Check localStorage for banner preference when component mounts
  useEffect(() => {
    const bannerDismissed = sessionStorage.getItem('devBannerDismissed');
    setShowDevBanner(bannerDismissed !== 'true');
  }, []);

  // Handle banner dismissal
  const handleDismissBanner = () => {
    setShowDevBanner(false);
    sessionStorage.setItem('devBannerDismissed', 'true');
  };

  // Famous game quotes
  const gameQuotes = [
    { quote: "War. War never changes.", source: "Fallout" },
    { quote: "It's dangerous to go alone! Take this.", source: "The Legend of Zelda" },
    { quote: "The cake is a lie.", source: "Portal" },
    { quote: "Nothing is true, everything is permitted.", source: "Assassin's Creed" },
    { quote: "A man chooses, a slave obeys.", source: "BioShock" },
    { quote: "Stay awhile and listen.", source: "Diablo" },
    { quote: "Wake up, Mr. Freeman. Wake up and smell the ashes.", source: "Half-Life 2" },
    { quote: "Would you kindly?", source: "BioShock" },
    { quote: "You have died of dysentery.", source: "The Oregon Trail" },
    { quote: "Do a barrel roll!", source: "Star Fox 64" },
    { quote: "I used to be an adventurer like you. Then I took an arrow in the knee.", source: "The Elder Scrolls V: Skyrim" },
    { quote: "It's super effective!", source: "Pokémon" }
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
      {/* Development Notice Banner */}
      {showDevBanner && (
        <div className="absolute top-14 left-0 right-0 z-40 bg-primary/90 backdrop-blur-sm py-1.5 px-3 text-center shadow-md">
          <div className="container mx-auto flex items-center justify-center">
            <p className="text-sm font-medium text-dark">
              GameGloom is currently under development. Some features may be limited or unavailable.
            </p>
            <button
              onClick={handleDismissBanner}
              className="ml-3 p-1 text-dark hover:text-black transition-colors cursor-pointer"
              aria-label="Dismiss notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      </div>

      <div className="relative container mx-auto px-3 w-full">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          {/* Left Side Content */}
          <div className="space-y-6 py-4">
            <motion.h1
              className="text-3xl md:text-5xl font-bold text-light leading-tight mt-2"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              {user ? `Welcome Back, ${user.username}` : 'Your Gaming Journey\nStarts Here'}
            </motion.h1>

            {user ? (
              <div className="h-36 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuoteIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-l-4 border-primary pl-4 py-2">
                      <p className="text-xl md:text-2xl text-light/95 font-semibold italic leading-tight">
                        "{gameQuotes[currentQuoteIndex].quote}"
                      </p>
                      <p className="text-sm text-primary mt-2 font-medium">
                        — {gameQuotes[currentQuoteIndex].source}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <motion.p
                className="text-base text-light/80 max-w-lg mt-1 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.6 }}
              >
                Track your games, share reviews, and connect with fellow gamers in one place
              </motion.p>
            )}

            {/* CTA Buttons */}
            <motion.div
              className="flex gap-5 pt-2 mt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              {!user ? (
                <>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      to="/signup"
                      label="Join Now"
                      variant="primary"
                      icon={<UserPlus className="mr-1 h-4 w-4" />}
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      to="/about"
                      label="Learn More"
                      variant="secondary"
                    />
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto"
                  >
                    <Button
                      to="/discover"
                      label="Find Your Next Adventure"
                      variant="primary"
                      icon={<Search className="mr-1 h-4 w-4" />}
                      className="w-full"
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto"
                  >
                    <Button
                      to="/discover/recommendations"
                      label="Your Recommendations"
                      variant="secondary"
                      className="w-full"
                    />
                  </motion.div>
                </>
              )}
            </motion.div>

            {/* Feature Highlights */}
            <motion.div
              className="grid grid-cols-3 gap-4 pt-4 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="p-3 rounded-lg bg-surface-dark backdrop-blur-sm hover:bg-surface-dark/60 transition-all duration-300 cursor-pointer border border-dark/60"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.2 + (index * 0.15) }}
                  whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                >
                  <div className="text-primary mb-2">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-light text-sm mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-light/70">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
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
                  <div className="absolute -top-8 left-0 right-0 text-center">
                    <h2 className="text-sm font-semibold text-primary">
                      {user ? 'Recommended For You' : 'Featured Games'}
                    </h2>
                  </div>
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