import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/HomePage";
import MyGames from "./pages/MyGamesPage";
import Discover from "./pages/DiscoverPage";
import Community from "./pages/CommunityPage";
import GameDetails from "./pages/GameDetailsPage";
import NotFound from "./pages/NotFoundPage";

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