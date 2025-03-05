import React, { useState, useRef, useEffect } from "react";
import { ArrowUpDown, ChevronDown, Check } from "lucide-react";

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "rating-high", label: "Rating (High to Low)" },
  { value: "rating-low", label: "Rating (Low to High)" },
  { value: "release-new", label: "Release Date (Newest)" },
  { value: "release-old", label: "Release Date (Oldest)" },
];

const SortDropdown = ({
  sortOption,
  onSortChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    return option ? option.label : "Default";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
          isOpen 
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
                className={`w-full text-left px-3 py-1.5 rounded text-xs flex items-center cursor-pointer ${
                  sortOption === option.value 
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