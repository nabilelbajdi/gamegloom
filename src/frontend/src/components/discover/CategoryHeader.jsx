import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const CategoryHeader = ({ title, description }) => {
  return (
    <div className="relative pt-24 pb-10 mb-6">
      <div className="absolute inset-0 bg-[var(--bg-base)] pointer-events-none"></div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-center mb-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-gray-400 hover:text-primary transition-colors duration-200 mr-4"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
            <span className="text-sm font-medium">Home</span>
          </Link>

          <div className="h-4 w-px bg-gray-700/50 mr-4"></div>

          <div className="text-sm text-gray-500">
            <Link to="/discover" className="hover:text-gray-300 transition-colors">Discover</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-400">{title}</span>
          </div>
        </div>

        <div className="pl-0 md:pl-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-3">
            {title}
          </h1>

          {description && (
            <p className="text-gray-400 text-sm md:text-base max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryHeader; 