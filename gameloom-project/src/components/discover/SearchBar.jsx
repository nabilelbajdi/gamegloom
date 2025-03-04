import React from "react";
import { Search, X } from "lucide-react";

const SearchBar = ({ value, onChange }) => {
  return (
    <div className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search games..."
          className="w-full bg-surface/40 text-light placeholder-gray-400 text-sm rounded-lg pl-10 pr-10 py-2 focus:outline-none focus:bg-surface/70 transition-colors"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar; 