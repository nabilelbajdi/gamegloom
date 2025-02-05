import React from "react";
import { useParams } from "react-router-dom";

const GamePage = () => {
  const { title } = useParams();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl text-white">Game Details for {title}</h1>
      <p className="text-gray-400">More details will be loaded here...</p>
    </div>
  );
};

export default GamePage;