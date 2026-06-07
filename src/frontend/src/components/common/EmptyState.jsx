// src/components/common/EmptyState.jsx
import React from "react";
import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";

// Consistent empty state used wherever a successful fetch returns no items.
// `action` is optional: { label, to } renders a Link; { label, onClick } renders a button.
const EmptyState = ({
  icon: Icon = SearchX,
  title = "Nothing here yet",
  message = "",
  action = null,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gray-500" />
    </div>
    <h3 className="text-xl font-semibold text-light mb-2">{title}</h3>
    {message && <p className="text-gray-400 max-w-md mb-4">{message}</p>}
    {action && action.to && (
      <Link
        to={action.to}
        className="mt-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg transition-colors"
      >
        {action.label}
      </Link>
    )}
    {action && action.onClick && (
      <button
        onClick={action.onClick}
        className="mt-2 text-primary hover:underline cursor-pointer"
      >
        {action.label}
      </button>
    )}
  </div>
);

export default EmptyState;
