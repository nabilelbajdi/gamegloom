// src/components/common/GameCarousel.jsx
import React, { useRef, useState, useCallback, memo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Slider from "react-slick";
import GameCard from "../game/GameCard";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { getSliderSettings } from "../../utils/sliderConfig";
import { Link } from "react-router-dom";

const GameCarousel = memo(({ 
  games, 
  title, 
  viewAllLink, 
  maxGames = 6, 
  slidesToShow = 6 
}) => {
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const handleAfterChange = useCallback((current) => {
    const newSlideIndex = Math.floor(current / slidesToShow);
    setCurrentSlide(newSlideIndex);
  }, [slidesToShow]);

  if (!games) return null;
  if (games.length === 0) return null;

  const displayedGames = games?.slice(0, maxGames) ?? [];
  const totalSlides = Math.ceil(displayedGames.length / slidesToShow);
  
  const settings = {
    ...getSliderSettings(displayedGames.length, slidesToShow),
    arrows: false,
    dots: false,
    afterChange: handleAfterChange,
  };
  
  const handlePrev = () => {
    sliderRef.current?.slickPrev();
  };
  
  const handleNext = () => {
    sliderRef.current?.slickNext();
  };

  const renderSlideIndicators = () => {
    const indicators = [];
    for (let i = 0; i < totalSlides; i++) {
      indicators.push(
        <div 
          key={i}
          className={`h-1 rounded-full mx-0.5 transition-all duration-300 ${
            i === currentSlide 
              ? "w-4 bg-primary" 
              : "w-1.5 bg-gray-600"
          }`}
        />
      );
    }
    return indicators;
  };

  return (
    <section className="mt-10">
      {/* Section Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-light">{title}</h2>
        
        <div className="flex items-center gap-2">
          {viewAllLink && (
            <Link 
              to={viewAllLink} 
              className="text-primary hover:text-primary-dark transition-colors text-sm mr-2"
            >
              View All
            </Link>
          )}
          
          {/* Custom Navigation Arrows */}
          <button 
            onClick={handlePrev}
            className="w-8 h-8 rounded-full bg-surface-dark/60 backdrop-blur-sm flex items-center justify-center text-gray-200 hover:text-white hover:bg-primary/20 transition-all duration-200 shadow-sm cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={handleNext}
            className="w-8 h-8 rounded-full bg-surface-dark/60 backdrop-blur-sm flex items-center justify-center text-gray-200 hover:text-white hover:bg-primary/20 transition-all duration-200 shadow-sm cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Slick Slider */}
      <div className="-mx-2">
        <Slider ref={sliderRef} {...settings}>
          {displayedGames.map((game) => (
            <div key={game.id} className="px-2">
              <GameCard game={game} />
            </div>
          ))}
        </Slider>
      </div>
      
      {/* Subtle Slide Indicators */}
      {totalSlides > 1 && (
        <div className="flex justify-center mt-4">
          <div className="flex items-center">
            {renderSlideIndicators()}
          </div>
        </div>
      )}
    </section>
  );
});

export default GameCarousel;
