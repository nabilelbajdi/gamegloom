import React from "react";
import Header from "./components/Header"
import Hero from "./components/Hero"
import ReviewedGames from "./components/ReviewedGames"
import Footer from "./components/Footer"

const App = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <Hero />
      <ReviewedGames />
      <Footer />
    </div>
  );
};

export default App;