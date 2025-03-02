import React from "react";
import { Link } from "react-router-dom";
import { Plus, Sparkles, FolderPlus } from "lucide-react";

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
export const EmptyLibrary = () => (
  <EmptyState 
    title="Your library is empty"
    description="Start building your game collection by discovering new games and adding them to your library."
    icon={Sparkles}
    actionLabel="Discover Games"
    actionLink="/discover"
  />
);

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

// Empty lists component
export const EmptyLists = () => (
  <EmptyState 
    title="No Custom Lists Yet"
    description="Create custom lists to organize your games in your own way."
    icon={FolderPlus}
    actionLabel="Create List"
    actionLink="#"
  />
);

export default EmptyState; 