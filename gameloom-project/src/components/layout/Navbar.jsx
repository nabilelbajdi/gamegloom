import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLoadingBar } from "../../App";
import Icon from "../UI/Icon";
import SearchResults from "../search/SearchResults";
import debounce from "lodash/debounce";
import useUserGameStore from "../../store/useUserGameStore";
import { LogOut } from "lucide-react";

const NAV_ITEMS = [
  { name: "My Library", path: "/library" },
  { 
    name: "Discover", 
    path: "/discover",
    dropdown: [
      { name: "Trending Now", path: "/discover/trending" },
      { name: "Anticipated Games", path: "/discover/anticipated" },
      { name: "Highly Rated Games", path: "/discover/highly-rated" },
      { name: "Latest Releases", path: "/discover/latest-releases" },
      { name: "Browse by Genre", path: "/discover/genres" },
      { name: "Community Lists", path: "/discover/community-lists" },
      { name: "Recommendations", path: "/discover/recommendations" },
    ]
  },
  { name: "Community", path: "/community" },
  { name: "Articles", path: "/articles" }
];

const LoadingSkeleton = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 navbar-blur border-b border-navbar-border">
    <div className="max-w-7xl mx-auto px-2 flex items-center justify-between h-12">
      <Link to="/" className="text-lg font-bold cursor-pointer px-2">
        GameLoom
      </Link>

      <div className="hidden md:flex pl-10 space-x-2">
        {NAV_ITEMS.map((_, index) => (
          <div key={index} className="nav-link text-xs">
            <div className="h-4 w-16 bg-gray-700 animate-pulse rounded"></div>
          </div>
        ))}
      </div>

      <form className="flex items-center flex-grow max-w-md px-2">
        <div className="relative flex items-center w-full bg-white rounded overflow-hidden">
          <div className="w-16 h-8 bg-gray-300 animate-pulse"></div>
          <div className="flex-1 h-8 bg-gray-300 animate-pulse"></div>
          <div className="w-10 h-8 bg-gray-300 animate-pulse"></div>
        </div>
      </form>

      <div className="hidden md:flex items-center space-x-2">
        <div className="h-5 w-24 bg-gray-700 animate-pulse rounded"></div>
        <div className="h-8 w-16 bg-gray-700 animate-pulse rounded"></div>
      </div>

      <div className="md:hidden p-2">
        <div className="h-5 w-5 bg-gray-700 animate-pulse rounded"></div>
      </div>
    </div>
  </nav>
);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const loadingBar = useLoadingBar();
  const { collection, fetchCollection } = useUserGameStore();

  // Fetch collection when user is logged in
  useEffect(() => {
    if (user) {
      fetchCollection();
    }
  }, [user]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/search?query=${encodeURIComponent(query)}`
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  // Handle search input
  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    debouncedSearch(query);
  };

  // Handle search result selection
  const handleSearchSelect = (game) => {
    setSearchQuery("");
    setSearchResults([]);
  };

  // Handle click outside of search container
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchQuery("");
        setSearchResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    loadingBar.start();
    logout();
    navigate("/");
    loadingBar.complete();
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 navbar-blur border-b border-navbar-border">
      <div className="max-w-7xl mx-auto px-2 flex items-center justify-between h-12">
        <Link to="/" className="text-lg font-bold cursor-pointer px-2">
          GameLoom
        </Link>

        <div className="hidden md:flex pl-10 space-x-2">
          {NAV_ITEMS.map((item, index) => (
            item.dropdown ? (
              <div key={index} className="relative group">
                <Link 
                  to={item.path} 
                  className="nav-link px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-all duration-200 flex items-center"
                >
                  {item.name}
                  <Icon name="chevron-down" className="icon ml-1.5 w-3 h-3" />
                </Link>
                <div className="absolute left-0 mt-0.5 w-48 rounded-md shadow-lg bg-surface-dark border border-gray-800/50 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 hover:opacity-100 hover:visible z-50">
                  <div className="py-1.5" role="menu">
                    {item.dropdown.map((dropdownItem, dropdownIndex) => (
                      <Link
                        key={dropdownIndex}
                        to={dropdownItem.path}
                        className="block px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200 my-0.5"
                        role="menuitem"
                      >
                        {dropdownItem.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link 
                key={index} 
                to={item.path} 
                className="nav-link px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-all duration-200"
              >
                {item.name}
              </Link>
            )
          ))}
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="flex items-center flex-grow max-w-md px-2">
          <div className="relative w-full" ref={searchContainerRef}>
            <div className="flex items-center w-full bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center border-r border-gray-300 h-8">
                <button type="button" className="flex items-center px-3 hover:bg-gray-100 h-full">
                  <span className="text-xs text-gray-700">All</span>
                  <Icon name="chevron-down" className="icon ml-1.5 w-3 h-3 text-gray-600" />
                </button>
              </div>
              <div className="relative flex-grow flex items-center">
                <div className="absolute left-3 flex items-center justify-center h-full">
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-primary rounded-full animate-spin"></div>
                  ) : (
                    <Icon name="search" className="icon w-4 h-4 text-gray-500 cursor-default pointer-events-none" />
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Search game..."
                  value={searchQuery}
                  onChange={handleSearchInput}
                  className="w-full h-8 pl-10 pr-3 text-xs text-gray-700 placeholder-gray-500 focus:outline-none"
                />
              </div>
              {searchQuery && (
                <button 
                  type="button" 
                  className="px-3 h-8 hover:bg-gray-100 flex items-center cursor-pointer"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setIsSearching(false);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            <div className="absolute left-0 right-0 top-full mt-2">
              {searchResults.length > 0 && (
                <SearchResults
                  results={searchResults}
                  onSelect={handleSearchSelect}
                />
              )}
            </div>
          </div>
        </form>

        <div className="hidden md:flex items-center space-x-2">
          <Link 
            to="/library" 
            className="nav-link px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-all duration-200"
          >
            <div className="flex items-center space-x-2">
              <Icon name="bookmark-plus" className="icon pointer-events-none" />
              <span>Collection</span>
              {user && collection.want_to_play.length > 0 && (
                <span className="bg-primary text-dark rounded-full px-2">
                  {collection.want_to_play.length}
                </span>
              )}
            </div>
          </Link>

          {user ? (
            <div className="relative group">
              <button
                className="nav-link px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-all duration-200 flex items-center space-x-2 focus:outline-none cursor-pointer"
              >
                <Icon name="user" className="icon pointer-events-none" />
                <span>{user.username}</span>
              </button>

              <div className="absolute right-0 mt-1 w-48 rounded-lg shadow-lg bg-surface-dark border border-gray-800/50 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 hover:opacity-100 hover:visible">
                <div className="py-1" role="menu">
                  <Link
                    to="/profile"
                    className="block px-3 py-1.5 text-sm text-gray-100 hover:bg-gray-800/50 transition-colors duration-200"
                    role="menuitem"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-3 py-1.5 text-sm text-gray-100 hover:bg-gray-800/50 transition-colors duration-200"
                    role="menuitem"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-1.5 text-sm text-red-700 hover:bg-gray-800/50 transition-colors duration-200"
                    role="menuitem"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="w-3.5 h-3.5" />
                      Logout
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="nav-link px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-all duration-200"
            >
              Sign In
            </Link>
          )}
        </div>

        <button 
          className="md:hidden p-2"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <Icon name="close" className="icon" /> : <Icon name="menu" className="icon" />}
        </button>
      </div>

      <div className={`md:hidden bg-navbar-bg border-t border-navbar-border transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 hidden"}`}>
        <div className="flex flex-col space-y-4 p-4">
          {NAV_ITEMS.map((item, index) => (
            item.dropdown ? (
              <div key={index} className="space-y-1">
                <Link 
                  to={item.path} 
                  className="nav-link text-xs hover:bg-gray-800 rounded-md px-3 py-1.5 flex items-center justify-between"
                  onClick={() => setIsOpen(false)}
                >
                  <span>{item.name}</span>
                </Link>
                <div className="ml-4 pl-2 border-l border-gray-700 space-y-1.5">
                  {item.dropdown.map((dropdownItem, dropdownIndex) => (
                    <Link
                      key={dropdownIndex}
                      to={dropdownItem.path}
                      className="nav-link text-xs hover:bg-gray-800 rounded-md px-3 py-1.5 block text-gray-300 hover:text-white"
                      onClick={() => setIsOpen(false)}
                    >
                      {dropdownItem.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link 
                key={index} 
                to={item.path} 
                className="nav-link text-xs hover:bg-gray-800 rounded-md px-3 py-1.5" 
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            )
          ))}
          {user ? (
            <>
              <Link to="/profile" className="nav-link text-xs hover:bg-gray-800 rounded-md px-3 py-1.5" onClick={() => setIsOpen(false)}>
                Profile
              </Link>
              <button onClick={handleLogout} className="nav-link text-xs text-left hover:bg-gray-800 rounded-md px-3 py-1.5">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link text-xs hover:bg-gray-800 rounded-md px-3 py-1.5" onClick={() => setIsOpen(false)}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
