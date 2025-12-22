// src/components/common/GameCarousel.jsx
import React, { useRef, useState, useEffect, memo } from "react";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import GridGameCard from "../game/GridGameCard";
import SectionHeader from "./SectionHeader";
import { Link } from "react-router-dom";

const GameCarousel = memo(({
  games,
  title,
  viewAllLink,
  maxGames = 24,
  slidesToShow = 6,
  onSlideChange
}) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [displayedGames, setDisplayedGames] = useState([]);
  const [totalSlides, setTotalSlides] = useState(0);

  // Process games on mount or when games change
  useEffect(() => {
    if (!games || games.length === 0) {
      setDisplayedGames([]);
      setTotalSlides(0);
      return;
    }

    const filtered = games.slice(0, maxGames);
    setDisplayedGames(filtered);
    setTotalSlides(Math.ceil(filtered.length / slidesToShow));

    // Check if should show right arrow initially
    if (filtered.length > slidesToShow) {
      setShowRightArrow(true);
    } else {
      setShowRightArrow(false);
    }
  }, [games, maxGames, slidesToShow]);

  // Check scroll position to determine if arrows should be shown
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    setShowLeftArrow(container.scrollLeft > 20);
    setShowRightArrow(container.scrollLeft < (container.scrollWidth - container.clientWidth - 20));

    // Calculate current slide for indicators
    const slideWidth = container.clientWidth;
    const currentSlideIndex = Math.round(container.scrollLeft / slideWidth);
    if (currentSlideIndex !== currentSlide) {
      setCurrentSlide(currentSlideIndex);
      if (onSlideChange) {
        onSlideChange(currentSlideIndex);
      }
    }
  };

  // Scroll event listener to update arrow visibility
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();

    container.addEventListener('scroll', checkScrollPosition);

    window.addEventListener('resize', checkScrollPosition);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [currentSlide]);

  // Scrolling functions
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollLeft -= scrollAmount;
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollLeft += scrollAmount;
  };

  const renderSlideIndicators = () => {
    const indicators = [];
    for (let i = 0; i < totalSlides; i++) {
      indicators.push(
        <div
          key={i}
          className={`h-1 rounded-full mx-0.5 transition-all duration-300 ${i === currentSlide
            ? "w-4 bg-primary"
            : "w-1.5 bg-gray-600"
            }`}
        />
      );
    }
    return indicators;
  };

  const sectionIcon = title === "Trending Now" ? (
    <TrendingUp size={22} className="text-primary fill-primary" />
  ) : null;

  const cardWidth = `calc(${100 / slidesToShow}% - ${(slidesToShow - 1) * 8 / slidesToShow}px)`;

  if (displayedGames.length === 0) {
    return null;
  }

  return (
    <section className={title === "Trending Now" ? "mt-4" : "mt-10"}>
      {/* Section Header */}
      <div className="flex justify-between items-center mb-2">
        <SectionHeader
          title={title}
          viewAllLink={viewAllLink}
          icon={sectionIcon}
          showGradient={true}
        />

        <div className="flex items-center gap-2">
          {/* Custom Navigation Arrows */}
          <button
            onClick={scrollLeft}
            className={`w-8 h-8 rounded-full bg-surface-dark/60 backdrop-blur-sm flex items-center justify-center text-gray-200 hover:text-white hover:bg-primary/20 transition-all duration-200 shadow-sm cursor-pointer ${showLeftArrow ? 'opacity-80' : 'opacity-30 cursor-not-allowed'}`}
            aria-label="Previous slide"
            disabled={!showLeftArrow}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={scrollRight}
            className={`w-8 h-8 rounded-full bg-surface-dark/60 backdrop-blur-sm flex items-center justify-center text-gray-200 hover:text-white hover:bg-primary/20 transition-all duration-200 shadow-sm cursor-pointer ${showRightArrow ? 'opacity-80' : 'opacity-30 cursor-not-allowed'}`}
            aria-label="Next slide"
            disabled={!showRightArrow}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Game Cards Container */}
      <div className="relative">
        {/* Left fade gradient */}
        <div className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[var(--bg-base)] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`}></div>

        {/* Right fade gradient */}
        <div className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[var(--bg-base)] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0'}`}></div>

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth snap-x gap-3 pb-2"
          style={{ scrollBehavior: "smooth" }}
        >
          {displayedGames.map((game) => (
            <div
              key={game.id}
              className="flex-shrink-0"
              style={{ width: cardWidth, minWidth: cardWidth }}
            >
              <GridGameCard game={game} />
            </div>
          ))}
        </div>
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
