import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gaming-primary text-gaming-light">
      <Navbar />
      <main className="flex-grow min-w-screen container mx-auto content-center">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
