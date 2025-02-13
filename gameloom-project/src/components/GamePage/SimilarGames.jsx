import React, { memo } from "react";
import Slider from "react-slick";
import GameCard from "../game/GameCard";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { getSliderSettings } from "../../../utils/sliderConfig";

const SimilarGames = memo(({ games }) => {
  if (!games || games.length === 0) {
    return <p className="text-center text-gray-400">No similar games found.</p>;
  }

  const displayedGames = games?.slice(0, 8) ?? [];
  const settings = getSliderSettings(displayedGames.length);

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-light mb-4">Discover Similar Games</h2>
      <Slider {...settings}>
        {displayedGames.map((game) => (
          <div key={game.id} className="px-2">
            <GameCard game={game} />
          </div>
        ))}
      </Slider>
    </section>
  );
});

export default SimilarGames;
