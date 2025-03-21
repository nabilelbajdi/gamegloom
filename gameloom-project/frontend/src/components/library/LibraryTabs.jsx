import React from "react";
import { createSlug } from "../../utils/stringUtils";
import { ChevronRight } from "lucide-react";

export const TABS = [
  { id: "all", label: "All Games", color: "primary" },
  { id: "want_to_play", label: "Want to Play", color: "primary" },
  { id: "playing", label: "Playing", color: "primary" },
  { id: "played", label: "Completed", color: "primary" }
];

const LibraryTabs = ({ activeTab, setActiveTab, collection, totalGames, myLists, setSelectedList, selectedList }) => {
  // Get selected list name if any
  const selectedListName = selectedList ? 
    myLists.find(list => list.id === selectedList)?.name : null;
    
  return (
    <div className="flex items-center overflow-x-auto hide-scrollbar flex-shrink-0 md:flex-nowrap">
      {TABS.map(tab => (
        <TabButton 
          key={tab.id}
          id={tab.id} 
          label={tab.label} 
          count={tab.id === "all" ? totalGames : (collection[tab.id]?.length || 0)}
          color={tab.color}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      ))}
      <div className="flex items-center">
        <TabButton 
          id="my_lists"
          label="My Lists"
          count={myLists.length}
          color="primary"
          activeTab={activeTab}
          setActiveTab={(id) => {
            setActiveTab(id);
            setSelectedList(null);
          }}
        />
        
        {/* Show selected list name if any */}
        {activeTab === "my_lists" && selectedListName && (
          <div className="flex items-center text-gray-300 ml-2">
            <ChevronRight className="h-4 w-4 text-gray-500" />
            <span className="max-w-[150px] truncate text-sm ml-1" title={selectedListName}>
              {selectedListName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Tab button component
const TabButton = ({ id, label, count, color = "primary", activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`px-2.5 py-1.5 whitespace-nowrap text-sm font-semibold transition-colors cursor-pointer ${
      activeTab === id
        ? `text-${color} border-b-2 border-${color}`
        : "text-gray-400 hover:text-gray-300"
    }`}
  >
    {label} <span className="ml-1 text-xs opacity-70">{count}</span>
  </button>
);

export default LibraryTabs; 