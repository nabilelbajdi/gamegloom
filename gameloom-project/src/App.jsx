import React, { useRef, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoadingBar from "react-top-loading-bar";
import { useRouteLoadingBar } from "./hooks/useRouteLoadingBar";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import MyLibraryPage from "./pages/MyLibraryPage";
import DiscoverPage from "./pages/DiscoverPage";
import CommunityPage from "./pages/CommunityPage";
import StatsPage from "./pages/StatsPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import ArticlesPage from "./pages/ArticlesPage";
import SignUpPage from "./pages/SignUpPage";
import GamePage from "./pages/GamePage";

const LoadingBarContext = createContext(null);

export const useLoadingBar = () => {
  const context = useContext(LoadingBarContext);
  if (!context) {
    throw new Error('useLoadingBar must be used within LoadingBarProvider');
  }
  return context;
};

function AppContent() {
  useRouteLoadingBar();
  
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/library" element={<MyLibraryPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </>
  );
}

const App = () => {
  const loadingRef = useRef(null);
  const loadingBar = {
    start: () => loadingRef.current?.continuousStart(),
    complete: () => loadingRef.current?.complete(),
  };

  return (
    <LoadingBarContext.Provider value={loadingBar}>
      <AuthProvider>
        <Router>
          <LoadingBar 
            color="var(--color-primary)"
            ref={loadingRef}
            shadow={true}
            height={3}
            transitionTime={200}
            waitingTime={400}
          />
          <AppContent />
        </Router>
      </AuthProvider>
    </LoadingBarContext.Provider>
  );
};

export default App;
