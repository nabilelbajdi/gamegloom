// src/components/common/GameCarousel.jsx
import React, { useEffect, memo } from "react";
import Slider from "react-slick";
import GameCard from "../game/GameCard";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { getSliderSettings } from "../../utils/sliderConfig";

const GameCarousel = memo(({ 
  games, 
  title, 
  viewAllLink, 
  maxGames = 6, 
  slidesToShow = 6 
}) => {

    if (!games) return null;

  if (games.length === 0) return null;

  const displayedGames = games?.slice(0, maxGames) ?? [];
  const settings = getSliderSettings(displayedGames.length, slidesToShow);

  return (
    <section className="container mx-auto px-4 md:px-8 lg:px-22 mt-8">
      {/* Section Title */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-light">{title}</h2>
        {viewAllLink && (
          <a 
            href={viewAllLink} 
            className="text-primary hover:text-primary-dark transition-colors"
          >
            View All
          </a>
        )}
      </div>

      {/* Slick Slider */}
      <div className="-mx-2">
        <Slider {...settings}>
          {displayedGames.map((game) => (
            <div key={game.id} className="px-2">
              <GameCard game={game} />
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
});

export default GameCarousel;
