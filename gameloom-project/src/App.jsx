import React from "react";
import Header from "./components/Header"

const App = () => {
  return (
    <div className="min-h-screen bg-purple-900 text-white">
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-purple-900 text-white">  
        <h1 className="text-3xl font-bold underline">Hello World!</h1>
      </div>
    </div>
  );
};

export default App;