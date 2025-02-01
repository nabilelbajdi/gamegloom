import React from "react";

const NotFound = () => {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)] text-center">
        <div>
          <h1 className="text-6xl text-red-800 font-bold">404</h1>
          <p className="text-xl text-white mt-4">Page not found!</p>
        </div>
      </div>
    );
  };

export default NotFound;