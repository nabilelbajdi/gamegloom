import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import MyGames from "./pages/MyGames";
import Discover from "./pages/Discover";
import Community from "./pages/Community";
import GameDetails from "./pages/GameDetails";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="my-games" element={<MyGames />} />
          <Route path="discover" element={<Discover />} />
          <Route path="community" element={<Community />} />
          <Route path="game/:id" element={<GameDetails />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;