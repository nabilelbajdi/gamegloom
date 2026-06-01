import React, { useRef, createContext, useContext, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoadingBar from "react-top-loading-bar";
import { useRouteLoadingBar } from "./hooks/useRouteLoadingBar";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import ScrollToTopOnMount from "./components/common/ScrollToTopOnMount";
import ToastContainer from "./components/common/Toast/ToastContainer";
import ErrorBoundary from "./components/common/ErrorBoundary";
import CookieBanner from "./components/common/CookieBanner";

// Everything else loads on demand - each becomes its own chunk in the build.
const MyLibraryPage = lazy(() => import("./pages/MyLibraryPage"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const GamePage = lazy(() => import("./pages/GamePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const TrendingGamesPage = lazy(() => import("./pages/discover/TrendingGamesPage"));
const AnticipatedGamesPage = lazy(() => import("./pages/discover/AnticipatedGamesPage"));
const HighlyRatedGamesPage = lazy(() => import("./pages/discover/HighlyRatedGamesPage"));
const LatestReleasesPage = lazy(() => import("./pages/discover/LatestReleasesPage"));
const GenrePage = lazy(() => import("./pages/discover/GenrePage"));
const ThemePage = lazy(() => import("./pages/discover/ThemePage"));
const RecommendationsPage = lazy(() => import("./pages/discover/RecommendationsPage"));
const BrowseListsPage = lazy(() => import("./pages/BrowseListsPage"));
const GamesPage = lazy(() => import("./pages/discover/GamesPage"));
const ListDetailPage = lazy(() => import("./pages/ListDetailPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SyncReviewPage = lazy(() => import("./pages/SyncReviewPage"));
const ImportPage = lazy(() => import("./pages/ImportPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));

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
  const location = useLocation();

  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'].includes(location.pathname);

  return (
    <>
      <ScrollToTopOnMount />
      {!isAuthPage && <Navbar />}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<MyLibraryPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/discover/trending" element={<TrendingGamesPage />} />
            <Route path="/discover/anticipated" element={<AnticipatedGamesPage />} />
            <Route path="/discover/highly-rated" element={<HighlyRatedGamesPage />} />
            <Route path="/discover/latest-releases" element={<LatestReleasesPage />} />
            <Route path="/discover/recommendations" element={<RecommendationsPage />} />
            <Route path="/lists" element={<BrowseListsPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/lists/:listId" element={<ListDetailPage />} />
            <Route path="/genre/:genreSlug" element={<GenrePage />} />
            <Route path="/theme/:themeSlug" element={<ThemePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/sync" element={<ImportPage />} />
            <Route path="/sync/:platform" element={<SyncReviewPage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      {!isAuthPage && <Footer />}
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
            waitingTime={200}
          />
          <AppContent />
          <ToastContainer />
          <CookieBanner />
        </Router>
      </AuthProvider>
    </LoadingBarContext.Provider>
  );
};

export default App;
