import React from "react";
import { Calendar, Tag, Crown } from "lucide-react";
import { Link } from "react-router-dom";

const GameOfTheYear = () => {
  // Sample data for Astro Bot (since this changes every year)
  const astroBot = {
    id: "astrobot-2024",
    slug: "astro-bot",
    name: "Astro Bot",
    metascore: 94,
    releaseYear: 2024,
    genres: ["Platformer"],
    description: "Experience the critically acclaimed Astro Bot in this charming adventure. Guide Astro through stunning worlds filled with ingenious platforming challenges, delightful surprises, and creative homages to PlayStation history.",
    artwork: "https://gmedia.playstation.com/is/image/SIEPDC/astro-bot-hero-desktop-01-en-23may24?$2400px$"
  };

  return (
    <section className="relative my-16 overflow-hidden shadow-2xl">
      {/* Background image with overlay*/}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 z-10"></div>
        {/* Top fade gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[var(--bg-base)] via-[var(--bg-base)]/60 to-transparent z-10"></div>
        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/60 to-transparent z-10"></div>
        <img
          src={astroBot.artwork}
          alt={`${astroBot.name} - Game of the Year 2024`}
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto px-6 py-24 md:py-32">
        <div className="max-w-2xl ml-4 md:ml-8 lg:ml-12">
          <div className="mb-2 inline-flex items-center px-3 py-1 bg-white/10 backdrop-blur-sm text-white text-sm tracking-wider rounded-full font-semibold">
            <Crown size={14} className="mr-1.5 text-primary fill-primary" />
            Game of the Year 2024
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            {astroBot.name}
          </h2>

          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center">
              <div className="w-7 h-7 rounded bg-green-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">{astroBot.metascore}</span>
              </div>
            </div>

            <div className="flex items-center text-white/80 border-l border-white/20 pl-4">
              <Calendar size={16} className="mr-2 text-primary" />
              <span>{astroBot.releaseYear}</span>
            </div>

            <div className="text-white/80 border-l border-white/20 pl-4">
              {astroBot.genres.join(", ")}
            </div>
          </div>

          <p className="text-white/90 mb-8 leading-relaxed line-clamp-2 md:line-clamp-none">
            {astroBot.description}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to={`/game/${astroBot.slug}`}
              className="px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-md hover:bg-white/20 backdrop-blur-sm transition-colors flex items-center"
            >
              View Details
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameOfTheYear; 