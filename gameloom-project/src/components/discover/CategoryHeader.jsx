import React from "react";

const CategoryHeader = ({ title, description }) => {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="/images/emerald.jpg" 
          alt="Category Background" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/70 to-dark/90"></div>
      </div>
      <div className="container mx-auto px-4 py-12 pt-20 relative z-10">
        <div className="text-center mt-6">
          <h1 
            className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent" 
            style={{ backgroundImage: "var(--text-gradient)" }}
          >
            {title}
          </h1>
          {description && (
            <p className="text-gray-300 text-base max-w-2xl mx-auto text-center">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryHeader; 