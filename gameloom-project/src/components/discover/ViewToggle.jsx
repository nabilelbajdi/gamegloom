import React from "react";
import { LayoutGrid, List } from "lucide-react";

const ViewToggle = ({
  viewMode,
  onViewChange
}) => {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onViewChange("grid")}
        title={viewMode === "grid" ? "Selected: Grid View" : "Grid View"}
        className={`
          p-1.5 rounded-md transition-all duration-200 cursor-pointer
          ${viewMode === "grid" 
            ? "bg-primary/10 text-primary" 
            : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/20"
          }
        `}
        aria-label="Grid view"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewChange("list")}
        title={viewMode === "list" ? "Selected: List View" : "List View"}
        className={`
          p-1.5 rounded-md transition-all duration-200 cursor-pointer
          ${viewMode === "list" 
            ? "bg-primary/10 text-primary" 
            : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/20"
          }
        `}
        aria-label="List view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ViewToggle; 