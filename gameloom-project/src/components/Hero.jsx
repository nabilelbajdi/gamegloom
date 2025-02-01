import React from "react";

const Hero = () => {
  return (
    <section className="h-screen flex items-center justify-center relative" id="main-content">
      {/* Hero Video */}
      <video
        autoPlay
        playsInline
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-70"
        aria-label="Background Video"
      >
        <source src="src/assets/videos/hero-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* Hero Text & CTA */}
      <div className="relative z-10 text-center px-4">
        <h1 className="mb-2 font-heading text-gradient">Track Your Gaming Journey</h1>
        <p className="text-xl mb-4 font-body text-gradient">Discover, Track, and Share Your Favorite Games</p>
        <button className="btn-hero">Get Started</button>
      </div>
    </section>
  );
};

export default Hero;