import React from "react";
import Header from "./components/Header"
import Hero from "./components/Hero"
import ReviewedGames from "./components/ReviewedGames"

const App = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <Hero />
      <ReviewedGames />
    </div>
  );
};

export default App;