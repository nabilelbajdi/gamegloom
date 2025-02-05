import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../UI/Button";
import Icon from "../UI/Icon";
import Logo from "../UI/Logo";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "My Library", path: "/library" },
    { name: "Discover", path: "/discover" },
    { name: "Community", path: "/community" },
    { name: "Articles", path: "/articles" },
    { name: "Stats & Insights", path: "/stats" },
  ];
  
  const icons = ["search", "bell", "user"];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 navbar-blur border-b border-navbar-border">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        
        {/* Logo */}
        <Logo className="h-40 md:h-40 lg:h-40 mt-3 transition-transform duration-300 hover:scale-105 " />

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-2">
          {navItems.map((item, index) => (
            <Link key={index} to={item.path} className="nav-link">
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right Section (Icons + Sign Up Button) */}
        <div className="hidden md:flex items-center space-x-6">
          {icons.map((icon, index) => (
            <Icon key={index} name={icon} className="icon" />
          ))}
          <Button to="/signup" label="Sign Up" variant="nav" />
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <Icon name="close" className="icon" /> : <Icon name="menu" className="icon" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden bg-navbar-bg border-t border-navbar-border transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 hidden"}`}>
        <div className="flex flex-col space-y-4 p-4">
          {navItems.map((item, index) => (
            <Link key={index} to={item.path} className="nav-link" onClick={() => setIsOpen(false)}>
              {item.name}
            </Link>
          ))}
          <Button to="/signup" label="Sign Up" variant="nav" onClick={() => setIsOpen(false)} />
        </div>
      </div>
    </nav>
  );
}
