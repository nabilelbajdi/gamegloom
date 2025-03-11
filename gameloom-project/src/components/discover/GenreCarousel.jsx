import React, { memo, useRef, useState, useCallback } from "react";
import Slider from "react-slick";
import GenreCard from "../../pages/discover/GenreCard";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { getSliderSettings } from "../../utils/sliderConfig";
import { ChevronLeft, ChevronRight, ChevronRight as ArrowRight } from "lucide-react";

const GenreCarousel = memo(({ 
  genres, 
  title, 
  viewAllLink, 
  maxGenres = 16,
  slidesToShow = 4,
  games = {},
  type = "genre",
  loading = false,
  onSlideChange = () => {}
}) => {
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  if (!genres || genres.length === 0) return null;

  const displayedGenres = genres?.slice(0, maxGenres) ?? [];
  const totalSlides = Math.ceil(displayedGenres.length / slidesToShow);
  
  const handleAfterChange = useCallback((current) => {
    const newSlideIndex = Math.floor(current / slidesToShow);
    setCurrentSlide(newSlideIndex);
    onSlideChange(newSlideIndex);
  }, [slidesToShow, onSlideChange]);
  
  const settings = {
    ...getSliderSettings(displayedGenres.length, slidesToShow),
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
    <section className="mt-8">
      {/* Section Title with Custom Navigation */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-light">{title}</h2>
          {viewAllLink && (
            <a 
              href={viewAllLink} 
              className="flex items-center text-xs text-gray-400 hover:text-primary transition-colors ml-3 mt-1 font-semibold"
            >
              <span>View all</span>
              <ArrowRight size={14} className="ml-1" />
            </a>
          )}
        </div>
        
        {/* Custom Navigation Arrows */}
        <div className="flex items-center gap-2">
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
          {displayedGenres.map((genre) => (
            <div key={genre.slug} className="px-2">
              <GenreCard 
                title={genre.title} 
                genreSlug={genre.slug} 
                games={games[genre.slug] || []} 
                type={type}
                loading={loading || !games[genre.slug]}
              />
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

export default GenreCarousel; 