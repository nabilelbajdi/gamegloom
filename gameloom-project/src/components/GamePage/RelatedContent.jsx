import React, { memo, useState } from "react";
import { BookOpen, Package, Gift, Bookmark, Layers, Anchor, Calendar, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import RelatedGameCover from "./RelatedGameCover";

const ITEMS_PER_PAGE = 5;

const RelatedContent = memo(({ 
  dlcs = [], 
  expansions = [], 
  remakes = [], 
  remasters = [], 
  bundles = [],
  ports = [],
  standalone_expansions = [],
  seasons = [],
  packs = []
}) => {
  const tabs = [
    { id: 'dlcs', title: 'DLCs', icon: <Gift className="w-4 h-4 mr-1" />, content: dlcs },
    { id: 'expansions', title: 'Expansions', icon: <BookOpen className="w-4 h-4 mr-1" />, content: expansions },
    { id: 'bundles', title: 'Game Editions & Bundles', icon: <Package className="w-4 h-4 mr-1" />, content: bundles },
    { id: 'remakes', title: 'Remakes', icon: <Bookmark className="w-4 h-4 mr-1" />, content: remakes },
    { id: 'remasters', title: 'Remasters', icon: <Copy className="w-4 h-4 mr-1" />, content: remasters },
    { id: 'ports', title: 'Ports', icon: <Anchor className="w-4 h-4 mr-1" />, content: ports },
    { id: 'standalone_expansions', title: 'Standalone Expansions', icon: <Layers className="w-4 h-4 mr-1" />, content: standalone_expansions },
    { id: 'seasons', title: 'Seasons', icon: <Calendar className="w-4 h-4 mr-1" />, content: seasons },
    { id: 'packs', title: 'Packs & Add-ons', icon: <Package className="w-4 h-4 mr-1" />, content: packs }
  ].filter(tab => tab.content && tab.content.length > 0);

  // Check if any related content exists
  if (tabs.length === 0) {
    return null;
  }

  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-light mb-4">Related Content</h2>
      
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-800 mb-6">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-md transition-colors cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-surface-dark text-primary border-b-2 border-primary' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-surface-dark/70'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.title}
            {tab.content.length > 0 && (
              <span className="ml-2 text-xs bg-surface-dark text-gray-400 px-2 py-0.5 rounded-full">
                {tab.content.length}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Active Tab Content */}
      {tabs.map(tab => (
        activeTab === tab.id && (
          <ContentSection 
            key={tab.id}
            title={tab.title}
            icon={tab.icon}
            items={tab.content}
          />
        )
      ))}
    </section>
  );
});

// Content section with pagination
const ContentSection = ({ title, icon, items }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [showAll, setShowAll] = useState(false);
  
  // For pagination
  const pageCount = Math.ceil(items.length / ITEMS_PER_PAGE);
  const displayedItems = showAll ? items : items.slice(
    currentPage * ITEMS_PER_PAGE, 
    (currentPage + 1) * ITEMS_PER_PAGE
  );
  
  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % pageCount);
  };
  
  const prevPage = () => {
    setCurrentPage((prev) => (prev === 0 ? pageCount - 1 : prev - 1));
  };
  
  const toggleShowAll = () => {
    setShowAll(!showAll);
    setCurrentPage(0); // Reset to first page when toggling
  };
  
  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {displayedItems.map((item) => (
          <RelatedGameCover key={item.id} game={item} />
        ))}
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        {/* Pagination controls */}
        {!showAll && pageCount > 1 && (
          <div className="flex items-center space-x-3">
            <button 
              onClick={prevPage}
              className="p-1 rounded-full bg-surface-dark hover:bg-surface-dark/80 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-gray-300" />
            </button>
            <span className="text-sm text-gray-400">
              {currentPage + 1} / {pageCount}
            </span>
            <button 
              onClick={nextPage}
              className="p-1 rounded-full bg-surface-dark hover:bg-surface-dark/80 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        )}
        
        {/* Show more/less button - only show if items > ITEMS_PER_PAGE */}
        {items.length > ITEMS_PER_PAGE && (
          <button 
            onClick={toggleShowAll}
            className="text-primary text-sm font-semibold hover:underline transition-colors ml-auto cursor-pointer"
          >
            {showAll ? "Show Less" : "Show All"}
          </button>
        )}
      </div>
    </div>
  );
};

export default RelatedContent; 