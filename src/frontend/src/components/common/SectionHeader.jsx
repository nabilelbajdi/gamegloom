import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * A reusable section header component with a gradient underline effect
 * 
 * @param {Object} props
 * @param {string} props.title - The title text to display
 * @param {string} props.viewAllLink - Optional URL for the "View All" link
 * @param {React.ReactNode} props.icon - Optional icon to display before the title
 * @param {boolean} props.showGradient - Whether to show the gradient effect (default: true)
 */
const SectionHeader = ({
  title,
  viewAllLink,
  icon = null,
  showGradient = true
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      {viewAllLink ? (
        <Link
          to={viewAllLink}
          className="group flex items-center hover:opacity-80 transition-all"
        >
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors relative flex items-center">
            {icon && (
              <span className="mr-2 inline-flex">{icon}</span>
            )}
            {title}
            {showGradient && (
              <span className="absolute -bottom-2 left-0 w-32 h-1 bg-gradient-to-r from-primary to-transparent"></span>
            )}
          </h2>
          <ChevronRight className="w-6 h-6 ml-2 text-primary group-hover:translate-x-1 transition-transform" />
        </Link>
      ) : (
        <div className="flex items-center">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] relative flex items-center">
            {icon && (
              <span className="mr-2 inline-flex">{icon}</span>
            )}
            {title}
            {showGradient && (
              <span className="absolute -bottom-2 left-0 w-32 h-1 bg-gradient-to-r from-primary to-transparent"></span>
            )}
          </h2>
        </div>
      )}
    </div>
  );
};

export default SectionHeader; 