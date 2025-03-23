import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import Button from "../UI/Button";

const Footer = () => {
  return (
    <footer className="w-full bg-black py-6">
      <div className="container mx-auto my-6 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      <div className="container mx-auto px-4 md:px-20 py-8 md:py-10 grid grid-cols-1 md:grid-cols-4 gap-10 text-center md:text-left justify-items-center">
        
        {/* Brand & About */}
        <div>
          <h3 className="text-2xl font-semibold text-white mb-4">GameLoom</h3>
          <p className="text-sm leading-relaxed">
            Your ultimate gaming companion, discover new games, track your progress, and get personalized recommendations on your favorite games and more.
          </p>
        </div>
        
        {/* Quick Links */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Quick Links</h3>
          <ul className="space-y-1">
            <li><Link to="/" className="footer-link">Home</Link></li>
            <li><Link to="/my-games" className="footer-link">My Games</Link></li>
            <li><Link to="/discover" className="footer-link">Discover</Link></li>
            <li><Link to="/community" className="footer-link">Community</Link></li>
            <li><Link to="/news" className="footer-link">News</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Contact Us</h3>
          <p className="text-sm mb-2">support@gameloom.com</p>
          <p className="text-sm mb-2">+1 234 567 890</p>
          <div className="flex justify-center md:justify-start space-x-4 mt-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link">
              <Facebook className="footer-icon" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link">
              <Twitter className="footer-icon" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link">
              <Instagram className="footer-icon" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-link">
              <Youtube className="footer-icon" />
            </a>
          </div>
        </div>
        
        {/* Newsletter */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Stay Updated</h3>
          <p className="text-sm mb-3">Subscribe for the latest gaming news and exclusive offers.</p>
          <form className="flex items-center border border-primary rounded-md overflow-hidden p-1">
            <input
              type="email"
              placeholder="Your email..."
              className="w-full px-3 py-2 bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none"
            />
            <Button to="#" label="Subscribe" variant="subscribe" onClick={() => alert("Subscribed!")} />
          </form>
        </div>
      </div>
      
      {/* Separator Line */}
      <div className="container mx-auto my-6 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
      
      {/* Copyright */}
      <div className="text-center text-sm text-gray-500">
        <p>© 2025 GameLoom. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
