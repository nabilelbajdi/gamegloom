import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 p-8 text-gray-400 text-center">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        {/* About */}
        <div>
          <h3 className="text-xl font-bold text-gray-100 mb-2">About Us</h3>
          <p>
            GameLoom is your ultimate gaming companion, offering reviews, community, and more.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-xl font-bold text-gray-100 mb-2">Quick Links</h3>
          <ul>
            <li><a href="/" className="hover:text-white">Home</a></li>
            <li><a href="/my-games" className="hover:text-white">My Games</a></li>
            <li><a href="/discover" className="hover:text-white">Discover</a></li>
            <li><a href="/community" className="hover:text-white">Community</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-xl font-bold text-gray-100 mb-2">Contact Us</h3>
          <p>Email: support@gameloom.com</p>
          <p>Phone: +1 234 567 890</p>
        </div>
      </div>

      {/* Copyright */}
      <div className="container mx-auto text-center mt-8">
        <p>© 2025 GameLoom. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;