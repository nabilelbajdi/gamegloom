import React, { useState, useRef, useEffect } from "react";
import { Filter, Check, Gamepad2, Tags, LayoutGrid, ChevronDown } from "lucide-react";

// Filter data constants
export const PLATFORMS = ["PC", "PlayStation", "Xbox", "Nintendo"];
export const GENRES = ["RPG", "Action", "Strategy", "Adventure", "Shooter", "Simulation", "Sports", "Puzzle"];
export const THEMES = ["Fantasy", "Sci-Fi", "Horror", "Mystery", "Historical", "Cyberpunk"];

const FilterDropdown = ({ activeFilters, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({...activeFilters});
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

  // Sync tempFilters with activeFilters when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTempFilters({...activeFilters});
    }
  }, [isOpen, activeFilters]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const toggleFilter = (category, value) => {
    setTempFilters(prev => {
      const updatedFilters = { ...prev };
      if (updatedFilters[category].includes(value)) {
        updatedFilters[category] = updatedFilters[category].filter(item => item !== value);
      } else {
        updatedFilters[category] = [...updatedFilters[category], value];
      }
      return updatedFilters;
    });
  };

  const applyFilters = () => {
    onFilterChange(tempFilters);
    setIsOpen(false);
  };

  const resetFilters = () => {
    const emptyFilters = { platforms: [], genres: [], themes: [] };
    setTempFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  // Filter category component for dropdown
  const FilterCategory = ({ title, items, category, icon: Icon }) => (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1 font-medium">
        <Icon className="w-3 h-3" />
        <label>{title}</label>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map(item => (
          <label 
            key={item}
            className="flex items-center gap-1.5 text-gray-300 text-xs cursor-pointer hover:text-white py-1 px-1.5 rounded hover:bg-surface-hover"
            onClick={() => toggleFilter(category, item)}
          >
            <div className={`w-3.5 h-3.5 flex items-center justify-center border rounded ${tempFilters[category].includes(item) ? 'bg-primary border-primary' : 'border-gray-600'}`}>
              {tempFilters[category].includes(item) && <Check className="w-2.5 h-2.5 text-dark" />}
            </div>
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-semibold cursor-pointer ${isOpen 
          ? "bg-primary/20 text-primary" 
          : "bg-surface/50 text-gray-400 hover:text-gray-300"}`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Filters</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-80 bg-surface-dark border border-gray-800 rounded-lg shadow-xl p-3 z-40">
          <FilterCategory 
            title="PLATFORMS" 
            items={PLATFORMS} 
            category="platforms" 
            icon={Gamepad2} 
          />
          
          <FilterCategory 
            title="GENRES" 
            items={GENRES} 
            category="genres" 
            icon={Tags} 
          />
          
          <FilterCategory 
            title="THEMES" 
            items={THEMES} 
            category="themes" 
            icon={Filter} 
          />
          
          {/* Filter Action Buttons */}
          <div className="flex justify-between mt-2 pt-2 border-t border-gray-800">
            <button 
              onClick={resetFilters}
              className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 cursor-pointer"
            >
              Reset
            </button>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={applyFilters}
                className="px-3 py-1 rounded-md bg-primary text-dark text-xs font-medium hover:bg-primary/90 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown; 