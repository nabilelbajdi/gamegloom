import React from "react";

const GameCard = ({ coverImage, title, description }) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg">
      <img src={coverImage} alt={title} className="w-full h-48 object-cover hover:scale-105 transition-all duration-300 cursor-pointer" />
      <div className="p-4">
        <h3 className="cursor-pointer text-lg font-semibold mb-2 text-gradient">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
};

export default GameCard;
