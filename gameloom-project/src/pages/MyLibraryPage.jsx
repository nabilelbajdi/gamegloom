import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useUserGameStore from "../store/useUserGameStore";
import LibraryHeader from "../components/library/LibraryHeader";
import LibraryTabs from "../components/library/LibraryTabs";
import LibraryControls from "../components/library/LibraryControls";
import GameLibraryGrid from "../components/library/GameLibraryGrid";
import LoadingState from "../components/library/LoadingState";
import { EmptyLibrary } from "../components/library/EmptyState";
import ScrollToTop from "../components/discover/ScrollToTop";

const MyLibraryPage = () => {
  const { user, loading } = useAuth();
  const { collection, fetchCollection, isLoading } = useUserGameStore();
  
  // Component state
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("release_new");
  const [myLists, setMyLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    platforms: [],
    genres: [],
    themes: []
  });

  // Fetch user collection on mount
  useEffect(() => {
    if (user) {
      fetchCollection();
    }
  }, [user, fetchCollection]);

  // Calculate total games count
  const totalGames = collection ? (
    (collection.want_to_play?.length || 0) + 
    (collection.playing?.length || 0) + 
    (collection.played?.length || 0)
  ) : 0;

  // Filter handlers
  const removeFilter = (category, value) => {
    setActiveFilters(prev => {
      const updatedFilters = { ...prev };
      updatedFilters[category] = updatedFilters[category].filter(item => item !== value);
      return updatedFilters;
    });
  };

  const resetFilters = () => {
    setActiveFilters({ platforms: [], genres: [], themes: [] });
  };

  // Auth redirect
  if (!loading && !user) {
    return <Navigate to="/login" />;
  }

  // Loading state
  if (loading || isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-dark">
      <LibraryHeader />

      {/* Navigation and Filter Controls */}
      <div className="sticky top-12 z-30 bg-dark/95 backdrop-blur-sm border-b border-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-2">
          <div className="flex flex-col md:flex-row gap-3 justify-between">
            <LibraryTabs 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              collection={collection}
              totalGames={totalGames}
              myLists={myLists}
              setSelectedList={setSelectedList}
            />
            
            <LibraryControls 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortOption={sortOption}
              setSortOption={setSortOption}
              activeFilters={activeFilters}
              setActiveFilters={setActiveFilters}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {totalGames === 0 ? (
          <EmptyLibrary />
        ) : (
          <GameLibraryGrid 
            collection={collection}
            activeTab={activeTab}
            selectedList={selectedList}
            myLists={myLists}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortOption={sortOption}
            setSortOption={setSortOption}
            activeFilters={activeFilters}
            removeFilter={removeFilter}
            resetFilters={resetFilters}
          />
        )}
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default MyLibraryPage; 