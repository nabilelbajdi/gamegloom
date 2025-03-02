import React from "react";
import SearchBar from "./SearchBar";
import SortDropdown from "./SortDropdown";
import FilterDropdown from "./FilterDropdown";

const LibraryControls = ({
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  activeFilters,
  setActiveFilters
}) => {
  // Handle filter changes from FilterDropdown
  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
  };

  return (
    <div className="flex items-center gap-3 w-full md:max-w-md">
      {/* Search Bar */}
      <SearchBar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />
      
      {/* Sort Dropdown */}
      <SortDropdown 
        sortOption={sortOption} 
        setSortOption={setSortOption}
      />
      
      {/* Filter Dropdown */}
      <FilterDropdown 
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
};

export default LibraryControls; 