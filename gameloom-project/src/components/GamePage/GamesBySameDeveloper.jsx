import React, { memo } from "react";
import Slider from "react-slick";
import GameCard from "../game/GameCard";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

const GamesBySameDeveloper = memo(({ games, developerName }) => {
  if (!games || games.length === 0) {
    return <p className="text-center text-gray-400">No other games by this developer found.</p>;
  }

  const displayedGames = games?.slice(0, 8) || [];

  const settings = {
    dots: true,
    infinite: displayedGames.length > 4,
    speed: 500,
    slidesToShow: Math.min(displayedGames.length, 4),
    slidesToScroll: Math.min(displayedGames.length, 4),
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(displayedGames.length, 3),
          slidesToScroll: Math.min(displayedGames.length, 3),
          infinite: displayedGames.length > 3,
          dots: true
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: Math.min(displayedGames.length, 2),
          slidesToScroll: Math.min(displayedGames.length, 2),
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-light mb-4">More from {developerName}</h2>
      <Slider {...settings}>
        {displayedGames.map((game, index) => (
          <div key={game.id || index} className="px-2">
            <GameCard {...game} />
          </div>
        ))}
      </Slider>
    </section>
  );
});

export default GamesBySameDeveloper;
