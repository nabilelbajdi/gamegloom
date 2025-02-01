import React from "react";
import Header from "./components/Header"
import Hero from "./components/Hero"
import FeaturedGames from "./components/FeaturedGames"
import ReviewedGames from "./components/ReviewedGames"
import Footer from "./components/Footer"

const App = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-body">
      <Header />
      <Hero />
      <FeaturedGames />
      <ReviewedGames />
      <Footer />
    </div>
  );
};

export default App;