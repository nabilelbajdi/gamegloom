import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../UI/Button";
import Icon from "../UI/Icon";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [watchlistCount, setWatchlistCount] = useState(52); // Example count

  const navItems = [
    { name: "My Library", path: "/library" },
    { name: "Discover", path: "/discover" },
    { name: "Community", path: "/community" },
    { name: "Articles", path: "/articles" }
  ];

  const icons = ["bell", "user"];

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 navbar-blur border-b border-navbar-border">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <span className="text-lg font-bold cursor-pointer">GameLoom</span>

        {/* Desktop Navigation */}
        <div className="hidden md:flex pl-10">
          {navItems.map((item, index) => (
            <Link key={index} to={item.path} className="nav-link text-xs">
              {item.name}
            </Link>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center flex-grow max-w-md px-4">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search for a game"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border rounded px-3 py-2 text-xs w-full pr-10"
            />
            <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Icon name="search" className="icon" />
            </button>
          </div>
        </form>

        {/* Right Section (Icons + To Play + Sign Up Button) */}
        <div className="hidden md:flex items-center space-x-6">
          {icons.map((icon, index) => (
            <Icon key={index} name={icon} className="icon" />
          ))}
          {/* To Play Button */}
          <div className="flex items-center space-x-2 cursor-pointer">
            <Icon name="bookmark" className="icon" />
            <span className="text-xs">To Play</span>
            <span className="bg-yellow-500 text-black rounded-full px-2 text-xs font-semibold">
              {watchlistCount}
            </span>
          </div>
          <Button to="/signup" label="Sign Up" variant="nav" />
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <Icon name="close" className="icon" /> : <Icon name="menu" className="icon" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden bg-navbar-bg border-t border-navbar-border transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 hidden"}`}>
        <div className="flex flex-col space-y-4 p-4">
          {navItems.map((item, index) => (
            <Link key={index} to={item.path} className="nav-link text-xs" onClick={() => setIsOpen(false)}>
              {item.name}
            </Link>
          ))}
          <Button to="/signup" label="Sign Up" variant="nav" onClick={() => setIsOpen(false)} />
        </div>
      </div>
    </nav>
  );
}
