import React, { useRef, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Mail, Github, Linkedin, Twitter, ChevronRight as ArrowRight, ExternalLink } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import GameCardStatus from "../game/GameCardStatus";
import useStatusDropdown from "../../hooks/useStatusDropdown";

const SimplifiedGameCard = ({ game }) => {
  const { user } = useAuth();
  const {
    showStatusDropdown,
    coverImageRef,
    handleCoverMouseLeave,
    handleStatusChange
  } = useStatusDropdown();

  return (
    <Link
      to={`/game/${game.slug || game.igdb_id}`}
      className="block group relative overflow-hidden rounded-lg bg-surface transition-all duration-300 hover:bg-surface-hover w-full"
    >
      {/* Game Cover */}
      <div
        className="aspect-[3/4] overflow-hidden rounded-md relative"
        ref={coverImageRef}
        onMouseLeave={handleCoverMouseLeave}
      >
        <img
          src={game.coverImage}
          alt={game.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.01] group-hover:opacity-90"
        />

        {/* Status Ribbon */}
        <div className="absolute top-0 left-0 z-10">
          <GameCardStatus
            game={game}
            onStatusChange={handleStatusChange}
            showDropdown={showStatusDropdown}
          />
        </div>

        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Game Info */}
      <div className="p-3 bg-surface-dark transition-colors duration-300 group-hover:bg-surface-dark/90">
        <h3 className="text-sm font-semibold text-heading truncate">
          {game.name}
        </h3>
      </div>
    </Link>
  );
};

const RecentlyViewedGames = () => {
  const [recentGames, setRecentGames] = useState([]);
  const [totalGames, setTotalGames] = useState(0);
  const location = useLocation();
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollLeft -= scrollAmount;
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollLeft += scrollAmount;
    }
  };

  const clearRecentlyViewed = () => {
    localStorage.removeItem('recentlyViewedGames');
    setRecentGames([]);
    setTotalGames(0);
  };

  // Check scroll position to determine if arrows should be shown
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // Show left arrow if not at the beginning
      setShowLeftArrow(container.scrollLeft > 20);
      // Show right arrow if not at the end
      setShowRightArrow(container.scrollLeft < (container.scrollWidth - container.clientWidth - 20));
    }
  };

  useEffect(() => {
    // Load recently viewed games from localStorage
    const loadRecentGames = () => {
      try {
        const storedGames = localStorage.getItem('recentlyViewedGames');
        if (storedGames) {
          const parsedGames = JSON.parse(storedGames);
          setRecentGames(parsedGames);
          setTotalGames(parsedGames.length);
        }
      } catch (error) {
        console.error('Error loading recently viewed games:', error);
      }
    };

    loadRecentGames();

    // Listen for storage events to update if changed in another tab
    window.addEventListener('storage', loadRecentGames);

    return () => {
      window.removeEventListener('storage', loadRecentGames);
    };
  }, [location.pathname]);

  // Add scroll event listener to update arrow visibility
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      // Initial check
      checkScrollPosition();

      // Add listener for scroll events
      container.addEventListener('scroll', checkScrollPosition);

      // Also check when window resizes
      window.addEventListener('resize', checkScrollPosition);

      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, [recentGames]);

  // Check if we should show arrows initially (when games > 6)
  useEffect(() => {
    if (totalGames > 6) {
      setShowRightArrow(true);
    }
  }, [totalGames]);

  if (recentGames.length === 0) {
    return (
      <div className="mb-6 relative">
        <div className="flex justify-between items-center mb-3">
          <div className="text-2xl font-semibold text-white">View History</div>
        </div>
        <div className="flex items-center gap-3 border-l-2 border-gray-800 pl-3 py-1">
          <div className="text-gray-500 opacity-70">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <p className="text-gray-400 text-sm">Games you view will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 relative">
      <div className="flex justify-between items-center mb-4">
        <div className="text-2xl font-semibold text-white">View History</div>
        <button
          onClick={clearRecentlyViewed}
          className="text-xs text-gray-500 hover:text-primary transition-colors py-1 px-2 rounded-sm opacity-70 hover:opacity-100 cursor-pointer"
        >
          Clear history
        </button>
      </div>

      <div className="relative">
        {/* Navigation Arrows */}
        {totalGames > 6 && (
          <>
            <button
              onClick={scrollLeft}
              className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 rounded-full p-1.5 bg-surface-dark hover:bg-gray-800 transition-all duration-200 ${showLeftArrow ? 'opacity-80' : 'opacity-0 pointer-events-none'}`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            <button
              onClick={scrollRight}
              className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 rounded-full p-1.5 bg-surface-dark hover:bg-gray-800 transition-all duration-200 ${showRightArrow ? 'opacity-80' : 'opacity-0 pointer-events-none'}`}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        {/* Game Cards Container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 pb-2 scroll-smooth scrollbar-hide"
          style={{ scrollBehavior: "smooth" }}
        >
          {/* First 6 games fill the width evenly */}
          {recentGames.slice(0, 6).map((game) => (
            <div key={game.id || game.igdb_id} className="flex-shrink-0 w-[calc(16.67%-14px)]" style={{ minWidth: 'calc(16.67% - 14px)' }}>
              <SimplifiedGameCard game={game} />
            </div>
          ))}

          {/* Additional games only appear in scroll */}
          {recentGames.slice(6).map((game) => (
            <div key={game.id || game.igdb_id} className="flex-shrink-0 w-[calc(16.67%-14px)]" style={{ minWidth: 'calc(16.67% - 14px)' }}>
              <SimplifiedGameCard game={game} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FooterLink = ({ to, external = false, children }) => {
  const content = (
    <span className="relative inline-block group">
      {children}
      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300"></span>
    </span>
  );

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm tracking-wide py-1 flex items-center gap-1.5 group">
        {content}
        <ExternalLink className="w-3 h-3 opacity-70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
    );
  }

  return (
    <Link to={to} className="text-gray-400 hover:text-white transition-colors text-sm tracking-wide py-1">
      {content}
    </Link>
  );
};

const SocialIcon = ({ href, icon: Icon, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="relative group"
  >
    <div className="relative z-10 flex items-center justify-center w-9 h-9 rounded-full bg-gray-800/50 text-gray-400 group-hover:text-white group-hover:bg-gray-700/30 transition-all duration-300">
      <Icon className="w-[18px] h-[18px]" />
    </div>
    <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-300"></div>
  </a>
);

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    // Future subscription logic go here
    alert(`Thank you for subscribing with ${email}!`);
    setEmail("");
  };

  return (
    <footer className="w-full bg-[var(--bg-base)] relative">
      {/* Recently Viewed Games */}
      <div className="container mx-auto px-4 py-6">
        <RecentlyViewedGames />
      </div>

      {/* Gradient separator */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

      {/* Main Footer Content */}
      <div className="relative border-gray-800/30">
        <div className="container mx-auto px-4 pt-8 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-6 md:gap-x-4">
            {/* Left Column - Brand */}
            <div className="md:col-span-3 flex flex-col">
              <Link to="/" className="text-2xl font-bold text-white tracking-tight">
                Game<span className="text-primary">Gloom</span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed mt-2 mb-3 max-w-xs">
                Your premier destination for discovering, tracking, and sharing your gaming journey.
              </p>

              <div className="flex space-x-3">
                <SocialIcon href="https://github.com" icon={Github} label="GitHub" />
                <SocialIcon href="https://linkedin.com" icon={Linkedin} label="Twitter" />
                <SocialIcon href="https://twitter.com" icon={Twitter} label="LinkedIn" />
              </div>
            </div>

            {/* Center Columns - Navigation */}
            <div className="md:col-span-2 flex flex-col">
              <h3 className="text-white font-semibold mb-2 text-sm uppercase tracking-wider">Platform</h3>
              <ul className="space-y-1">
                <li><FooterLink to="/library">Library</FooterLink></li>
                <li><FooterLink to="/discover">Discover</FooterLink></li>
                <li><FooterLink to="/community">Community</FooterLink></li>
              </ul>
            </div>

            <div className="md:col-span-2 flex flex-col">
              <h3 className="text-white font-semibold mb-2 text-sm uppercase tracking-wider">Support</h3>
              <ul className="space-y-1">
                <li><FooterLink to="/about">About</FooterLink></li>
                <li><FooterLink to="/faq">FAQ</FooterLink></li>
                <li><FooterLink to="/contact">Contact</FooterLink></li>
              </ul>
            </div>

            <div className="md:col-span-2 flex flex-col">
              <h3 className="text-white font-semibold mb-2 text-sm uppercase tracking-wider">Legal</h3>
              <ul className="space-y-1">
                <li><FooterLink to="/terms">Terms</FooterLink></li>
                <li><FooterLink to="/privacy">Privacy</FooterLink></li>
                <li><FooterLink to="/copyright">Copyright</FooterLink></li>
              </ul>
            </div>

            {/* Right Column - Subscribe */}
            <div className="md:col-span-3 flex flex-col">
              <h3 className="text-white font-semibold mb-2 text-sm uppercase tracking-wider">Stay Connected</h3>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="flex-1 flex items-center gap-3 py-2.5 px-2 bg-black/10 rounded transition-colors border-b border-gray-800/50">
                  <Mail className="text-gray-500 h-4 w-4 opacity-70 flex-shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 bg-transparent border-none text-sm text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="py-2 px-3 rounded-md text-sm font-semibold flex items-center justify-center text-primary hover:text-primary/90 bg-black/10 hover:bg-black/20 transition-colors cursor-pointer group"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer - Copyright */}
      <div className="border-t border-gray-800/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-center items-center">
            <div className="text-gray-400 text-xs">
              © 2025 GameGloom. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
