import React from "react";

// Define tabs for navigation
export const TABS = [
  { id: "all", label: "All Games", color: "primary" },
  { id: "want_to_play", label: "Want to Play", color: "primary" },
  { id: "playing", label: "Playing", color: "primary" },
  { id: "played", label: "Completed", color: "primary" }
];

const LibraryTabs = ({ activeTab, setActiveTab, collection, totalGames, myLists, setSelectedList }) => {
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
      <button
        onClick={() => {
          setActiveTab("my_lists");
          setSelectedList(null);
        }}
        className={`px-2.5 py-1.5 whitespace-nowrap text-sm font-semibold transition-colors cursor-pointer ${activeTab === "my_lists" 
          ? "text-primary border-b-2 border-primary" 
          : "text-gray-400 hover:text-gray-300"}`}
      >
        My Lists {myLists.length > 0 && <span className="ml-1 text-xs opacity-70">({myLists.length})</span>}
      </button>
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