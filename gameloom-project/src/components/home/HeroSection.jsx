// src/components/home/HeroSection.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, UserPlus, TrendingUp, MessageSquare, Gamepad, ChevronLeft, ChevronRight } from "lucide-react";
import useGameStore from "../../store/useGameStore";
import Button from "../UI/Button";
import GameCardSimple from "../game/GameCardSimple";
import { useAuth } from "../../context/AuthContext";
import useUserGameStore from "../../store/useUserGameStore";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { motion } from "motion/react";

const HeroSection = () => {
  const navigate = useNavigate();
  const { trendingGames, fetchGames } = useGameStore();
  const { user } = useAuth();
  const { fetchCollection } = useUserGameStore();
  const [featuredGames, setFeaturedGames] = useState([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState("");
  const [animationKey, setAnimationKey] = useState(0);
  const sliderRef = useRef(null);

  useEffect(() => {
    if (!trendingGames || trendingGames.length === 0) {
      fetchGames("trending");
    } else if (featuredGames.length === 0) {
      if (Array.isArray(trendingGames) && trendingGames.length > 0) {
        const validGames = trendingGames.filter(game => 
          game && game.igdb_id && game.name && 
          (game.coverImage || game.cover_image)
        );
        
        if (validGames.length > 0) {
          const selectedGames = [];
          const gamesCopy = [...validGames];
          
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
      }
    }
  }, [trendingGames, fetchGames, featuredGames.length]);

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
    const contentSection = document.querySelector(".bg-dark");
    if (contentSection) {
      contentSection.scrollIntoView({ behavior: "smooth" });
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

  const features = [
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
              Your Gaming Journey <br />Starts Here
            </motion.h1>
            
            <motion.p 
              className="text-base text-light/80 max-w-lg mt-1 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              Track your games, share reviews, and connect with fellow gamers in one place
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              className="flex gap-5 pt-2 mt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
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
            <div className="w-full max-w-sm mx-auto px-4">
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
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          currentGameIndex === index ? "bg-primary w-4" : "bg-white/50"
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1 bg-dark/50 mt-4 rounded-full overflow-hidden">
                    <div 
                      key={animationKey}
                      className={`h-full bg-primary origin-left animate-progress ${
                        sliderSettings.autoplay ? 'animate-progress-running' : 'animate-progress-paused'
                      }`}
                      style={{ animationDuration: 'var(--carousel-duration)' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-[3/4] bg-gray-800 rounded-lg animate-pulse"></div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.5, 
          delay: 1.5,
          y: { 
            repeat: Infinity,
            repeatType: "reverse",
            duration: 0.8,
            ease: "easeInOut" 
          }
        }}
      >
        <button
          onClick={scrollToContent}
          className="text-light hover:text-primary hover:bg-dark/50 rounded-full p-1.5 transition-colors cursor-pointer"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </motion.div>
    </section>
  );
};

export default HeroSection;