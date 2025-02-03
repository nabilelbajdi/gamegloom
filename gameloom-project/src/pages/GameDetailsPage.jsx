import React from "react";
import { useParams } from "react-router-dom";

const GameDetails = () => {
  const { id } = useParams();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl text-white">Game Details for ID: {id}</h1>
      <p className="text-gray-400">More details will be loaded here...</p>
    </div>
  );
};

export default GameDetails;