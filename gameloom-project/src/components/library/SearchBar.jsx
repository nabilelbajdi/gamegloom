import React from "react";
import { Search, X } from "lucide-react";

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="relative flex-grow">
      <div className="flex items-center w-full bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="relative flex-grow flex items-center">
          <div className="absolute left-3 flex items-center justify-center h-full">
            <Search className="w-4 h-4 text-gray-500 cursor-default pointer-events-none" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search library..."
            className="w-full h-9 pl-10 pr-3 text-xs font-semibold text-gray-700 placeholder-gray-500 focus:outline-none"
          />
        </div>
        {searchQuery && (
          <button 
            type="button" 
            className="px-3 h-9 hover:bg-gray-100 flex items-center cursor-pointer"
            onClick={() => setSearchQuery("")}
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar; 