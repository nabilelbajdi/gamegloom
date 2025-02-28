// src/components/home/HeroSection.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, UserPlus, TrendingUp, MessageSquare, Gamepad } from "lucide-react";
import useGameStore from "../../store/useGameStore";
import Button from "../UI/Button";
import GameCardSimple from "../game/GameCardSimple";
import { useAuth } from "../../context/AuthContext";
import useUserGameStore from "../../store/useUserGameStore";

const HeroSection = () => {
  const navigate = useNavigate();
  const { trendingGames, fetchGames } = useGameStore();
  const { user } = useAuth();
  const { fetchCollection } = useUserGameStore();
  const [gameOfTheWeek, setGameOfTheWeek] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState("");

  useEffect(() => {
    if (!trendingGames || trendingGames.length === 0) {
      fetchGames("trending");
    } else if (!gameOfTheWeek) {
      if (Array.isArray(trendingGames) && trendingGames.length > 0) {
        const validGames = trendingGames.filter(game => 
          game && game.igdb_id && game.name && 
          (game.coverImage || game.cover_image)
        );
        
        if (validGames.length > 0) {
          const randomGame = validGames[Math.floor(Math.random() * validGames.length)];
          setGameOfTheWeek(randomGame);
          
          if (randomGame.artworks && randomGame.artworks.length > 0) {
            setBackgroundImage(randomGame.artworks[0]);
          } else if (randomGame.screenshots && randomGame.screenshots.length > 0) {
            setBackgroundImage(randomGame.screenshots[0]);
          } else if (randomGame.coverImage || randomGame.cover_image) {
            setBackgroundImage(randomGame.coverImage || randomGame.cover_image);
          }
        }
      }
    }
  }, [trendingGames, fetchGames, gameOfTheWeek]);

  useEffect(() => {
    if (user) {
      fetchCollection();
    }
  }, [user, fetchCollection]);

  const handleGameClick = () => {
    if (gameOfTheWeek) {
      navigate(`/games/${gameOfTheWeek.id}`);
    }
  };

  const scrollToContent = () => {
    const featuredSection = document.querySelector('#trending-games');
    if (featuredSection) {
      featuredSection.scrollIntoView({ behavior: 'smooth' });
    }
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
          <img
            src={backgroundImage}
            alt="Hero background"
            className="w-full h-full object-cover transition-opacity duration-500"
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
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-3xl md:text-5xl font-bold text-light leading-tight">
              Your Gaming Journey <br />Starts Here
            </h1>
            <p className="text-base text-light/80 max-w-lg">
              Track your games, share reviews, and connect with fellow gamers in one place
            </p>
            
            {/* CTA Buttons */}
            <div className="flex gap-3 pt-1">
              <Button 
                to="/signup"
                label="Join Now"
                variant="primary"
                icon={<UserPlus className="mr-1 h-4 w-4" />}
              />
              <Button 
                to="/about"
                label="Learn More"
                variant="secondary"
              />
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {features.map((feature) => (
                <div 
                  key={feature.title}
                  className="p-2 rounded-lg bg-dark/50 backdrop-blur-sm border border-primary/10 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="text-primary mb-1">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-light text-sm mb-0.5">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-light/70">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Game of the Week */}
          <div className="relative hidden md:block">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary font-semibold text-sm bg-dark/80 px-3 py-1 rounded-full backdrop-blur-sm border border-primary/20 z-10">
              Game of the Week
            </div>
            
            <div className="w-full max-w-xs mx-auto mt-3">
              {gameOfTheWeek ? (
                <GameCardSimple game={gameOfTheWeek} />
              ) : (
                <div className="w-full aspect-[3/4] bg-gray-800 rounded-lg animate-pulse"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
        <button
          onClick={scrollToContent}
          className="text-light hover:text-primary hover:bg-dark/50 rounded-full p-1.5 transition-colors"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </div>
    </section>
  );
};

export default HeroSection;