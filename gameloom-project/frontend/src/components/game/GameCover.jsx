import React from "react";
import { useAuth } from "../../context/AuthContext";
import GameCardStatus from "./GameCardStatus";
import useStatusDropdown from "../../hooks/useStatusDropdown";

const GameCover = ({ game }) => {
  const { user } = useAuth();
  const { 
    showStatusDropdown,
    coverImageRef, 
    handleCoverMouseLeave, 
    handleStatusChange 
  } = useStatusDropdown();

  return (
    <div className="relative overflow-hidden rounded-lg bg-surface transition-all duration-300">
      {/* Game Cover */}
      <div 
        className="aspect-[3/4] overflow-hidden rounded-lg relative"
        ref={coverImageRef}
        onMouseLeave={handleCoverMouseLeave}
      >
        <img
          src={game.coverImage || game.cover_image} 
          alt={game.name}
          className="h-full w-full object-cover shadow-md"
        />
        
        {/* Status Ribbon */}
        <div className="absolute top-0 left-0 z-10">
          <GameCardStatus 
            game={game} 
            onStatusChange={handleStatusChange}
            showDropdown={showStatusDropdown}
            size="large"
          />
        </div>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    </div>
  );
};

export default GameCover; 