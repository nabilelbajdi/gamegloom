import React from "react";
import ReviewCard from "./ReviewCard";
import "@fortawesome/fontawesome-free/css/all.min.css";
// Import images for the games
import eldenRingCover from "../assets/images/game-covers/elden-ring.jpg";
import witcher3Cover from "../assets/images/game-covers/witcher3.jpg";
import baldurGateCover from "../assets/images/game-covers/baldurs-gate-3.png";
import poe2Cover from "../assets/images/game-covers/poe2.jpg";

// Import user avatar
import userAvatar from "../assets/images/raven.jpeg";

const ReviewedGames = () => {
  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-100">Recently Reviewed</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReviewCard
          gameTitle="Elden Ring"
          platform="PS5"
          reviewText="Amazing game. I love the open world and the combat system. The story is engaging and the characters are memorable."
          user="the-tarnished123"
          date="Feb 20, 2025"
          likes={12}
          dislikes={3}
          coverImage={eldenRingCover}
          userAvatar={userAvatar}
        />

        <ReviewCard
          gameTitle="The Witcher 3"
          platform="XBOX"
          reviewText="Story is great. The world is beautiful and the gameplay is fun. I love the open world and the combat system."
          user="officialGeralt"
          date="Feb 22, 2025"
          likes={20}
          dislikes={5}
          coverImage={witcher3Cover}
          userAvatar={userAvatar}
        />

        <ReviewCard
          gameTitle="Baldur's Gate 3"
          platform="PC"
          reviewText="Best RPG I've played in a long time. The story is engaging and the gameplay is fun. Captivating story and characters."
          user="xxShadowHeartxx"
          date="Feb 10, 2025"
          likes={10}
          dislikes={2}
          coverImage={baldurGateCover}
          userAvatar={userAvatar}
        />

        <ReviewCard
          gameTitle="Path of Exile 2"
          platform="PC"
          reviewText="The sequel is better than the original. The gameplay is fun and the graphics are beautiful. I love the new character classes. I'm looking forward to the next expansion."
          user="exiled_ranger"
          date="Feb 15, 2025"
          likes={15}
          dislikes={3}
          coverImage={poe2Cover}
          userAvatar={userAvatar}
        />
      </div>
    </section>
  );
};

export default ReviewedGames;
