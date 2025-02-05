import React from "react";
import Button from "./UI/Button";

const Hero = () => {
  const stats = [
    { label: "Games Tracked", value: "1M+" },
    { label: "Active Users", value: "500.00+" },
    { label: "Reviews Posted", value: "200.00+" },
  ];

  return (
    <section className="h-screen flex-center relative">
      {/* Hero Video */}
      <video
        autoPlay
        playsInline
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-80 blur-[3px]"
        aria-label="Background Video"
      >
        <source src="/videos/hero-video-dark.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Hero Content */}
      <div className="text-center relative px-6 max-w-4xl fade-in">
        <h1 className="hero-title text-3xl sm:text-4xl md:text-5xl leading-tight">
          Track Your Gaming Journey
        </h1>
        <p className="hero-subtitle text-sm sm:text-base md:text-xl mt-2 leading-tight">
          Discover, Track, and Share Your Favorite Games.
        </p>

        {/* Call-to-Action */}
        <div className="mt-10">
          <Button to="/signup" label="Explore Games" variant="hero" />
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center space-x-8">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <span className="text-3xl font-bold text-primary">
              {stat.value}
            </span>
            <p className="text-sm text-gray-300">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-smooth">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-light"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;