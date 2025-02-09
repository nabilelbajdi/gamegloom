import React from "react";
import { ShoppingCart, Star, PlusCircle } from "lucide-react";

const GameSticky = ({ coverImage, name }) => {
  return (
    <div className="sticky top-20 self-start w-64 sm:w-52 md:w-64 sm:py-6 mt-24 sm:mt-0 flex flex-col items-center">
      <img
        src={coverImage}
        alt={name}
        className="w-full rounded-lg shadow-lg object-cover"
      />

      <div className="mt-8 w-full flex flex-col space-y-3">
        <button className="btn-nav w-full flex items-center gap-2 justify-center">
          <PlusCircle className="w-5 h-5" /> Add to Library
        </button>
        <button className="btn-nav w-full flex items-center gap-2 justify-center">
          <ShoppingCart className="w-5 h-5" /> Buy Now
        </button>
      </div>
    </div>
  );
};

export default GameSticky;
