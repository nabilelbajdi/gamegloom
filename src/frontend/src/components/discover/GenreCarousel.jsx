import React, { useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { getSliderSettings } from "../../utils/sliderConfig";
import GenreListCard from "./GenreListCard";
import SectionHeader from "../common/SectionHeader";

const GenreCarousel = ({ 
  title, 
  categories = [],
  games = {},
  type = "genre",
  loading = false,
  onSlideChange = () => {}
}) => {
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  if (!categories || categories.length === 0) return null;

  const slidesToShow = 4;
  const totalSlides = Math.ceil(categories.length / slidesToShow);
  
  const handleAfterChange = useCallback((current) => {
    const newSlideIndex = Math.floor(current / slidesToShow);
    setCurrentSlide(newSlideIndex);
    onSlideChange(newSlideIndex);
  }, [slidesToShow, onSlideChange]);
  
  const settings = {
    ...getSliderSettings(categories.length, slidesToShow),
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
    <section className="mt-1">
      {/* Section Header */}
      <div className="flex justify-between items-center mb-6">
        <SectionHeader 
          title={title}
          viewAllLink={type === "genre" ? "/genres" : "/themes"}
          showGradient={true}
        />
        
        <div className="flex items-center gap-2">
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
          {categories.map((category) => (
            <div key={category.slug} className="px-2">
              <GenreListCard 
                title={category.title} 
                slug={category.slug} 
                games={games[category.slug] || []} 
                type={type}
                loading={loading || !games[category.slug]}
              />
            </div>
          ))}
        </Slider>
      </div>

      {/* Slide Indicators */}
      {totalSlides > 1 && (
        <div className="flex justify-center mt-4">
          <div className="flex items-center">
            {renderSlideIndicators()}
          </div>
        </div>
      )}
    </section>
  );
};

export default GenreCarousel; 