import React, { useState, useRef, useEffect } from "react";
import { ArrowUpDown, ChevronDown, SortAsc, SortDesc, TrendingUp, TrendingDown, CalendarDays } from "lucide-react";

// Sort options data
export const SORT_OPTIONS = {
  TITLE: [
    { value: "name_asc", icon: SortAsc, label: "A to Z" },
    { value: "name_desc", icon: SortDesc, label: "Z to A" }
  ],
  RATING: [
    { value: "rating_high", icon: TrendingUp, label: "Highest to Lowest" },
    { value: "rating_low", icon: TrendingDown, label: "Lowest to Highest" }
  ],
  DATE: [
    { value: "release_new", icon: CalendarDays, label: "Newest Releases" },
    { value: "release_old", icon: (props) => <CalendarDays {...props} className="transform rotate-180" />, label: "Oldest Releases" }
  ]
};

const SortDropdown = ({ sortOption, setSortOption }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Option component for sort items
  const SortOption = ({ value, icon: Icon, label }) => (
    <button 
      onClick={() => {
        setSortOption(value);
        setIsOpen(false);
      }}
      className={`flex items-center w-full gap-2 px-2 py-1 rounded text-sm cursor-pointer ${
        sortOption === value 
          ? "bg-primary text-dark font-medium" 
          : "text-gray-300 hover:bg-surface-hover"
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-semibold cursor-pointer ${isOpen
          ? "bg-primary/20 text-primary" 
          : "bg-surface/50 text-gray-400 hover:text-gray-300"}`}
      >
        <ArrowUpDown className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sort</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-52 bg-surface-dark border border-gray-800 rounded-lg shadow-xl p-2 z-40">
          <div className="text-gray-400 text-xs mb-1 font-medium pl-2">TITLE</div>
          {SORT_OPTIONS.TITLE.map(option => (
            <SortOption 
              key={option.value}
              value={option.value} 
              icon={option.icon} 
              label={option.label} 
            />
          ))}
          
          <div className="text-gray-400 text-xs mt-2 mb-1 font-medium pl-2">RATING</div>
          {SORT_OPTIONS.RATING.map(option => (
            <SortOption 
              key={option.value}
              value={option.value} 
              icon={option.icon} 
              label={option.label} 
            />
          ))}
          
          <div className="text-gray-400 text-xs mt-2 mb-1 font-medium pl-2">DATE</div>
          {SORT_OPTIONS.DATE.map(option => (
            <SortOption 
              key={option.value}
              value={option.value} 
              icon={option.icon} 
              label={option.label} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SortDropdown; 