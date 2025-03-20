import React from "react";
import { Link } from "react-router-dom";
import { Plus, Library, List, Heart, Search } from "lucide-react";

// Base empty state component
const EmptyState = ({ title, description, icon: Icon, actionLabel, actionLink }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-6">
      <Icon className="w-10 h-10 text-primary" />
    </div>
    <h3 className="text-2xl font-semibold text-light mb-2">{title}</h3>
    <p className="text-gray-400 max-w-md mb-8">
      {description}
    </p>
    <Link
      to={actionLink}
      className="bg-primary hover:bg-primary/90 text-dark px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
    >
      {actionLabel}
    </Link>
  </div>
);

// Empty library component
export const EmptyLibrary = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-surface-dark/60 rounded-full flex items-center justify-center mb-4">
        <Library className="w-8 h-8 text-light/70" />
      </div>
      <h3 className="text-2xl font-semibold text-light mb-2">Your library is empty</h3>
      <p className="text-light/70 max-w-md mb-6">
        Start building your collection by adding games to your library.
      </p>
      <Link 
        to="/discover" 
        className="px-6 py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg transition-colors"
      >
        Browse Games
      </Link>
    </div>
  );
};

// Empty card component
export const EmptyCard = () => (
  <Link 
    to="/discover"
    className="block aspect-[3/4] bg-surface/40 rounded-lg transition-all duration-300 hover:bg-surface/60 shadow-lg hover:shadow-xl border border-surface-hover/30 group"
  >
    <div className="h-full flex flex-col items-center justify-center text-center gap-4 p-6">
      <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center transform transition-transform duration-300 group-hover:scale-105">
        <Plus className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h3 className="text-xl text-light font-medium">Add Games</h3>
        <p className="text-gray-400 text-sm mt-2">
          Find and add games to your collection
        </p>
      </div>
    </div>
  </Link>
);

// Empty search results 
export const EmptySearch = ({ query }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-surface-dark/60 rounded-full flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-light/70" />
      </div>
      <h3 className="text-xl font-semibold text-light mb-2">No games found</h3>
      {query ? (
        <p className="text-light/70 max-w-md">
          We couldn't find any games matching "<span className="text-primary">{query}</span>".
        </p>
      ) : (
        <p className="text-light/70 max-w-md">
          No games match your current filters.
        </p>
      )}
    </div>
  );
};

// Empty lists state
export const EmptyLists = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-surface-dark/60 rounded-full flex items-center justify-center mb-4">
        <List className="w-8 h-8 text-light/70" />
      </div>
      <h3 className="text-2xl font-semibold text-light mb-2">No Lists Created</h3>
      <p className="text-light/70 max-w-md mb-6">
        Create your first list to organize your games however you want.
      </p>
      <button 
        className="px-6 py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg transition-colors flex items-center gap-2"
      >
        <Plus size={18} />
        Create a List
      </button>
    </div>
  );
};

// Empty list games state
export const EmptyListGames = ({ listName }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-surface-dark/60 rounded-full flex items-center justify-center mb-4">
        <Heart className="w-8 h-8 text-light/70" />
      </div>
      <h3 className="text-2xl font-semibold text-light mb-2">
        No Games in <span className="inline-block max-w-[250px] truncate align-bottom" title={listName}>{listName}</span>
      </h3>
      <p className="text-light/70 max-w-md mb-6">
        Add games to this list from any game page.
      </p>
      <Link 
        to="/discover" 
        className="px-6 py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg transition-colors"
      >
        Browse Games
      </Link>
    </div>
  );
};

export default EmptyState; 