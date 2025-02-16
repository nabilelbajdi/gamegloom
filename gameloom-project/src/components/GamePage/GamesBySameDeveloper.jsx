// src/components/GamePage/GamesBySameDeveloper.jsx
import React, { memo } from "react";
import Slider from "react-slick";
import GameCard from "../game/GameCard";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { getSliderSettings } from "../../../utils/sliderConfig";

const GamesBySameDeveloper = memo(({ games, developerName }) => {
  if (!games || games.length === 0) {
    return <p className="text-center text-gray-400">No other games by this developer found.</p>;
  }
  

  const displayedGames = games?.slice(0, 8) ?? [];

  console.log("📢 DEBUG: GamesBySameDeveloper - Displayed Games:", displayedGames);

  const settings = getSliderSettings(displayedGames.length);

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-light mb-4">More from {developerName}</h2>
      <Slider {...settings}>
        {displayedGames.map((game) => (
          <div key={game.id} className="px-2">
            <GameCard game={game} title={game.title} />
          </div>
        ))}
      </Slider>
    </section>
  );
});

export default GamesBySameDeveloper;
