import React from "react";

const GameSticky = ({ coverImage, name }) => {
  return (
    <div className="sticky top-20 self-start w-40 sm:w-52 md:w-64 py-6">
      <img
        src={coverImage}
        alt={name}
        className="w-full rounded-lg shadow-lg object-cover"
      />
    </div>
  );
};

export default GameSticky;
