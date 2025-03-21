import React from 'react';

/**
 * TabNavigation component
 * @param {Object[]} tabs - Array of tab objects with id, title, icon, and content
 * @param {string} activeTab - The ID of the currently active tab
 * @param {function} setActiveTab - Function to set the active tab
 * @returns {JSX.Element}
 */
const TabNavigation = ({ tabs, activeTab, setActiveTab }) => {
  if (!tabs || tabs.length === 0) return null;
  
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-hide">
      {tabs.map(tab => (
        <button 
          key={tab.id}
          className={`flex items-center min-w-max px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === tab.id 
              ? 'bg-surface-dark text-primary shadow-sm shadow-primary/20 border-b-2 border-primary translate-y-[1px]' 
              : 'text-gray-400 hover:text-gray-300 hover:bg-surface-dark/30'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className={`transition-transform duration-200 ${activeTab === tab.id ? 'scale-105' : ''}`}>
            {tab.icon}
          </span>
          <span className="mx-1">{tab.title}</span>
          {tab.content?.length > 0 && (
            <span className="text-xs bg-surface-dark/80 text-gray-400 px-1.5 py-0.5 rounded-full">
              {tab.content.length}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation; 