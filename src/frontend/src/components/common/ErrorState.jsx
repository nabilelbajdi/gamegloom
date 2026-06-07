// src/components/common/ErrorState.jsx
import React from "react";
import { RotateCw } from "lucide-react";

// Shown when a fetch fails, so users get a retry instead of a false "empty".
const ErrorState = ({ message = "Something went wrong.", onRetry = null }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 rounded-lg bg-surface-dark/40 text-center">
    <p className="text-gray-400 text-sm">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-medium cursor-pointer"
      >
        <RotateCw size={16} /> Retry
      </button>
    )}
  </div>
);

export default ErrorState;
