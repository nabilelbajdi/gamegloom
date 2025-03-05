import React from "react";
import { Search, X } from "lucide-react";

const SearchInput = ({
  value,
  onChange
}) => {
  return (
    <div className="relative shrink-0">
      <div className="flex items-center w-64 bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="relative flex-grow flex items-center">
          <div className="absolute left-3 flex items-center justify-center h-full">
            <Search className="w-4 h-4 text-gray-500 cursor-default pointer-events-none" />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search games..."
            className="w-full h-8 pl-10 pr-3 text-xs font-semibold text-gray-700 placeholder-gray-500 focus:outline-none"
          />
        </div>
        {value && (
          <button
            onClick={() => onChange("")}
            className="px-3 h-8 hover:bg-gray-100 flex items-center cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchInput; 