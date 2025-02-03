import React from "react";
import Button from "./UI/Button";

const Hero = () => {
  return (
    <section className="h-screen flex-center relative">
      {/* Hero Video */}
      <video
        autoPlay
        playsInline
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-70 "
        aria-label="Background Video"
      >
        <source src="/videos/hero-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-60 md:opacity-50 lg:opacity-40"></div>

      {/* Hero Text & CTA */}
      <div className="text-center relative px-6 max-w-4xl fade-in">
        <h1 className="hero-title text-3xl sm:text-4xl md:text-5xl leading-tight">
          Track Your Gaming Journey
        </h1>
        <p className="hero-subtitle text-sm sm:text-base md:text-xl mt-2 leading-tight">
          Discover, Track, and Share Your Favorite Games.
        </p>
        <div className="mt-10">
          <Button to="/signup" label="Get Started" variant="hero" />
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--color-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
