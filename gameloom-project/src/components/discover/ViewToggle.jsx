import React from "react";
import { Grid, List } from "lucide-react";

const ViewToggle = ({
  viewMode,
  onViewChange
}) => {
  return (
    <div className="flex rounded-lg overflow-hidden">
      <button
        onClick={() => onViewChange("grid")}
        className={`flex items-center justify-center p-1.5 cursor-pointer ${
          viewMode === "grid" 
            ? "bg-primary text-dark" 
            : "bg-surface/50 text-gray-300 hover:bg-surface-hover hover:text-white"
        } transition-all`}
        aria-label="Grid view"
      >
        <Grid className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`flex items-center justify-center p-1.5 cursor-pointer ${
          viewMode === "list" 
            ? "bg-primary text-dark" 
            : "bg-surface/50 text-gray-300 hover:bg-surface-hover hover:text-white"
        } transition-all border-l border-gray-800/50`}
        aria-label="List view"
      >
        <List className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default ViewToggle; 