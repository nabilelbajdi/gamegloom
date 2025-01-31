import React from "react";
import searchIcon from "../assets/icons/search.svg";
import globeIcon from "../assets/icons/globe.svg";

const Header = () => {
  return (
    <nav className="bg-gray-950 p-3 fixed w-full z-20" role="navigation" aria-label="Main Navigation">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <a href="/" className="text-2xl font-gameloom">
          <span className="font-extralight text-[#C8AA6E] hover:text-[#ddb158] underline transition-colors duration-300">Game</span>
          <span className="font-semibold text-[#a879d7ea] hover:text-[#a065dc] underline transition-colors duration-300">Loom</span>
        </a>

        {/* Hamburger Icon (mobile only) */}
        <div className="hamburger md:hidden" onclick="document.getElementById('mobileNav').classList.toggle('open');" aria-label="Toggle Navigation">
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Desktop Menu */}
        <div className="desktop-menu hidden md:flex text-sm text-transform: uppercase">
          <a href="#" className="nav-link text-gray-300 hover:text-violet-400">Home</a>
          <a href="#" className="nav-link text-gray-300 hover:text-violet-400">My Games</a>
          <a href="#" className="nav-link text-gray-300 hover:text-violet-400">Discover</a>
          <a href="#" className="nav-link text-gray-300 hover:text-violet-400">Community</a>
          <a href="#" className="nav-link text-gray-300 hover:text-violet-400">News</a>
          <a href="#" className="nav-link text-gray-300 hover:text-violet-400">More</a>
        </div>

        {/* Top Right Icons + Sign Up Button */}
        <div className="hidden md:flex items-center space-x-4">
          <img src={searchIcon} alt="Search" className="icon search-icon" aria-hidden="true"></img>
          <img src={globeIcon} alt="Globe Icon" className="icon globe-icon" aria-hidden="true"></img>
          <button className="btn-nav" onClick={() => window.location.href = '/login'}>Sign Up</button> 
        </div>
      </div>

      {/* Mobile Nav */}
      <div id="mobileNav" className="mobile-nav bg-gray-950 w-full h-auto mt-2 p-4 text-sm">
        <a href="index.html" className="block nav-link text-gray-300 hover:text-violet-400">Home</a>
        <a href="my-games.html" className="block nav-link text-gray-300 hover:text-violet-400">My Games</a>
        <a href="#" className="block nav-link text-gray-300 hover:text-violet-400">Discover</a>
        <a href="#" className="block nav-link text-gray-300 hover:text-violet-400">Community</a>
        <a href="#" className="block nav-link text-gray-300 hover:text-violet-400">News</a>
        <a href="#" className="block nav-link text-gray-300 hover:text-violet-400">More</a>
        <div className="flex items-center space-x-4 mt-4">
          <div className="icon search-icon" aria-hidden="true"></div>
          <div className="icon globe-icon" aria-hidden="true"></div>
          <button className="btn-nav">Sign Up</button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
