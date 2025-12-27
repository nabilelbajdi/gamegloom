import React, { useState, useRef, useEffect } from "react";
import { ArrowUpDown, ChevronDown, Check } from "lucide-react";

const LIBRARY_SORT_OPTIONS = [
  { value: "last_played", label: "Recently Played" },
  { value: "playtime_high", label: "Most Playtime" },
  { value: "added_new", label: "Recently Added" },
  { value: "name_asc", label: "Name" },
  { value: "rating_high", label: "Top Rated" },
  { value: "release_new", label: "Latest Release" }
];

const SEARCH_SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "exact_match", label: "Exact Matches" },
  { value: "rating_high", label: "Top Rated" },
  { value: "name_asc", label: "Name" },
  { value: "release_new", label: "Latest Release" }
];

const SYNC_SORT_OPTIONS = [
  { value: "last_played", label: "Recently Played" },
  { value: "playtime_high", label: "Most Playtime" },
  { value: "name_asc", label: "Name" }
];

const SortDropdown = ({
  sortOption = "last_played",
  onSortChange,
  isSearchPage = false,
  isSyncPage = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Choose the appropriate sort options based on page type
  const SORT_OPTIONS = isSyncPage
    ? SYNC_SORT_OPTIONS
    : isSearchPage
      ? SEARCH_SORT_OPTIONS
      : LIBRARY_SORT_OPTIONS;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSortSelect = (value) => {
    onSortChange(value);
    setIsOpen(false);
  };

  const getCurrentSortLabel = () => {
    const option = SORT_OPTIONS.find(opt => opt.value === sortOption);
    return option ? option.label : "Recently Played";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer ${isOpen
          ? "bg-surface/80 text-white"
          : "bg-surface/30 text-gray-400 hover:text-white hover:bg-surface/50"
          } transition-all`}
      >
        <ArrowUpDown className="w-3.5 h-3.5" />
        <span>Sort by: {getCurrentSortLabel()}</span>
        <ChevronDown
          className={`w-3 h-3 ${isOpen ? "text-white" : "text-gray-500"} transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Sort Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface-dark rounded-lg shadow-lg z-50 border border-gray-800/50 overflow-hidden">
          <div className="p-2">
            {SORT_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => handleSortSelect(option.value)}
                className={`w-full text-left px-3 py-1.5 rounded text-[13px] flex items-center cursor-pointer ${sortOption === option.value
                  ? "bg-surface/80 text-white font-semibold"
                  : "text-gray-400 hover:bg-surface hover:text-white"
                  } transition-colors`}
              >
                {sortOption === option.value && (
                  <Check className="w-3 h-3 mr-1.5 text-primary" />
                )}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortDropdown; 