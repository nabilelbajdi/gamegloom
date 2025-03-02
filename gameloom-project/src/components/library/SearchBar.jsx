import React from "react";
import { Search, X } from "lucide-react";

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="relative flex-grow">
      <div className="flex items-center w-full bg-white rounded-xl overflow-hidden shadow-sm">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search library..."
          className="w-full h-9 px-3 text-xs font-semibold text-gray-700 placeholder-gray-500 focus:outline-none"
        />
        <button type="button" className="px-3 h-9 hover:bg-gray-100 flex items-center cursor-pointer">
          {searchQuery ? (
            <X 
              className="w-4 h-4 text-gray-700 cursor-pointer"
              onClick={() => setSearchQuery("")}
            />
          ) : (
            <Search className="w-4 h-4 text-gray-700" />
          )}
        </button>
      </div>
    </div>
  );
};

export default SearchBar; 