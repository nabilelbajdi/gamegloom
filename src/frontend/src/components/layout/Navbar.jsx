import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLoadingBar } from "../../App";
import Icon from "../UI/Icon";
import SearchResults from "../search/SearchResults";
import debounce from "lodash/debounce";
import useUserGameStore from "../../store/useUserGameStore";
import { LogOut, ChevronDown, Search as SearchIcon, Gamepad2, Users, Monitor, Tags, Library } from "lucide-react";
import { searchGames } from "../../api";

const NAV_ITEMS = [
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
  { name: "For you", path: "/discover/recommendations" },
  { name: "Games", path: "/games" }
];

const LoadingSkeleton = () => (
  <nav className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/60 via-black/30 to-transparent">
    <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-20">
      <Link to="/" className="text-lg font-bold cursor-pointer px-2">
        Game<span className="text-primary">Gloom</span>
      </Link>

      <div className="hidden md:flex pl-4 space-x-2">
        {NAV_ITEMS.map((_, index) => (
          <div key={index} className="nav-link text-xs">
            <div className="h-4 w-16 bg-gray-700 animate-pulse rounded"></div>
          </div>
        ))}
      </div>

      <form className="flex items-center flex-grow max-w-xl px-2">
        <div className="relative flex items-center w-full bg-white rounded overflow-hidden">
          <div className="w-16 h-8 bg-gray-300 animate-pulse"></div>
          <div className="flex-1 h-8 bg-gray-300 animate-pulse"></div>
          <div className="w-10 h-8 bg-gray-300 animate-pulse"></div>
        </div>
      </form>

      <div className="hidden md:flex items-center space-x-2">
        <div className="h-6 w-28 bg-gray-700 animate-pulse rounded"></div>
        <div className="h-9 w-20 bg-gray-700 animate-pulse rounded"></div>
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
  const [searchCategory, setSearchCategory] = useState("all");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const categoryButtonRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading, logout } = useAuth();
  const loadingBar = useLoadingBar();
  const { collection, fetchCollection, clearCollection } = useUserGameStore();

  // Search categories
  const SEARCH_CATEGORIES = [
    { id: "all", label: "All", icon: SearchIcon },
    { id: "games", label: "Titles", icon: Gamepad2 },
    { id: "developers", label: "Developers", icon: Users },
    { id: "platforms", label: "Platforms", icon: Monitor },
    { id: "keywords", label: "Keywords", icon: Tags }
  ];

  // Fetch collection when user is logged in
  useEffect(() => {
    if (user) {
      fetchCollection();
    }
  }, [user]);

  // Handle click outside for both search and category dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle category dropdown click outside
      if (
        categoryDropdownOpen &&
        categoryButtonRef.current &&
        categoryDropdownRef.current &&
        !categoryButtonRef.current.contains(event.target) &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setCategoryDropdownOpen(false);
      }

      if (searchResults.length > 0 || searchQuery) {
        const clickedOutsideSearchArea = (
          searchContainerRef.current &&
          !searchContainerRef.current.contains(event.target) &&
          searchDropdownRef.current &&
          !searchDropdownRef.current.contains(event.target)
        );

        if (clickedOutsideSearchArea) {
          const isSearchInput = event.target.closest('input[type="text"]');
          const isSearchForm = event.target.closest('form');

          if (!isSearchInput && (!isSearchForm || !isSearchForm.contains(searchContainerRef.current))) {
            setSearchQuery("");
            setSearchResults([]);
          }
        }
      }
    };

    // Handle escape key
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (categoryDropdownOpen) {
          setCategoryDropdownOpen(false);
        }
        if (searchResults.length > 0 || searchQuery) {
          setSearchQuery("");
          setSearchResults([]);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [categoryDropdownOpen, searchResults.length, searchQuery]);

  // Toggle dropdown and position it
  const toggleCategoryDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCategoryDropdownOpen(!categoryDropdownOpen);
  };

  // Position the dropdown when it's opened
  useEffect(() => {
    if (categoryDropdownOpen && categoryButtonRef.current && categoryDropdownRef.current) {
      const buttonRect = categoryButtonRef.current.getBoundingClientRect();
      categoryDropdownRef.current.style.top = `${buttonRect.bottom + 4}px`;
      categoryDropdownRef.current.style.left = `${buttonRect.left}px`;
    }
  }, [categoryDropdownOpen]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query, category) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const data = await searchGames(query, category, 6);
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
    debouncedSearch(query, searchCategory);
  };

  // Handle search form submit (on Enter key)
  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      // Cancel any pending searches by clearing the debounce
      debouncedSearch.cancel();
      setIsSearching(false);

      // Navigate to search page (or update search params if already there)
      const searchPath = `/search?query=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(searchCategory)}`;

      if (window.location.pathname === '/search') {
        const newParams = new URLSearchParams();
        newParams.set('query', searchQuery);
        newParams.set('category', searchCategory);
        setSearchParams(newParams);
      } else {
        navigate(searchPath);
      }

      setSearchQuery("");
      setSearchResults([]);
    }
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSearchCategory(category);
    setCategoryDropdownOpen(false);

    if (searchQuery.trim()) {
      debouncedSearch(searchQuery, category);
    }
  };

  // Handle search result selection
  const handleSearchSelect = (game) => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleLogout = () => {
    loadingBar.start();
    clearCollection(); // Clear user-specific data from store
    logout();
    navigate("/");
    loadingBar.complete();
  };

  const handleLogoClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/60 via-black/30 to-transparent">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-20">
        <Link to="/" className="text-lg font-bold cursor-pointer px-2" onClick={handleLogoClick}>
          Game<span className="text-primary">Gloom</span>
        </Link>

        <div className="hidden md:flex pl-4 space-x-2">
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

        <form onSubmit={handleSearchSubmit} className="flex items-center flex-grow max-w-xl px-2">
          <div className="relative w-full" ref={searchContainerRef}>
            <div className="flex items-center w-full bg-white rounded-md overflow-hidden shadow-sm">
              {/* Category selector button */}
              <div className="relative" ref={categoryButtonRef}>
                <button
                  type="button"
                  className="flex items-center h-8 px-3 hover:bg-gray-100 border-r border-gray-300 cursor-pointer"
                  onClick={toggleCategoryDropdown}
                  aria-haspopup="true"
                  aria-expanded={categoryDropdownOpen}
                  aria-label={`Search category: ${SEARCH_CATEGORIES.find(c => c.id === searchCategory)?.label}`}
                >
                  <span className="text-xs text-gray-700">
                    {SEARCH_CATEGORIES.find(c => c.id === searchCategory)?.label}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`ml-1 text-gray-600 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Category Dropdown */}
                {categoryDropdownOpen && (
                  <div
                    ref={categoryDropdownRef}
                    className="fixed w-36 z-[60] rounded-md shadow-lg bg-surface-dark border border-gray-800/50 overflow-hidden"
                    role="menu"
                  >
                    <div className="py-1.5">
                      {SEARCH_CATEGORIES.map(category => {
                        const IconComponent = category.icon;
                        return (
                          <button
                            key={category.id}
                            type="button"
                            className="block w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200 my-0.5 cursor-pointer"
                            onClick={() => handleCategorySelect(category.id)}
                            role="menuitem"
                          >
                            <div className="flex items-center gap-2">
                              <IconComponent size={14} className="text-gray-400" />
                              {category.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative flex-grow flex items-center">
                <div className="absolute left-3 flex items-center justify-center h-full">
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-primary rounded-full animate-spin"></div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="flex items-center justify-center cursor-pointer"
                      aria-label="Search"
                    >
                      <SearchIcon className="w-4 h-4 text-gray-500 hover:text-gray-700 transition-colors" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={(() => {
                    switch (searchCategory) {
                      case "games": return "Search titles...";
                      case "developers": return "Search developers...";
                      case "platforms": return "Search platforms...";
                      case "keywords": return "Search keywords...";
                      default: return "Search games, developers, keywords...";
                    }
                  })()}
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
                  aria-label="Clear search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchQuery && (
              <div
                className="absolute top-full left-0 right-0 mt-2 z-50"
                ref={searchDropdownRef}
              >
                <SearchResults
                  results={searchResults}
                  onSelect={handleSearchSelect}
                  category={searchCategory}
                  isLoading={isSearching}
                  searchQuery={searchQuery}
                />
              </div>
            )}
          </div>
        </form>

        <div className="hidden md:flex items-center space-x-2">
          <Link
            to="/library"
            className="nav-link px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-all duration-200"
          >
            <div className="flex items-center space-x-2">
              <Library size={16} className="text-gray-300" />
              <span>Library</span>
              {user && (collection.want_to_play.length + collection.playing.length + collection.played.length) > 0 && (
                <span className="bg-primary text-dark rounded-full px-2">
                  {collection.want_to_play.length + collection.playing.length + collection.played.length}
                </span>
              )}
            </div>
          </Link>

          {user ? (
            <div className="relative group">
              <button
                className="nav-link px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-all duration-200 flex items-center focus:outline-none cursor-pointer"
              >
                <Icon name="user" className="icon pointer-events-none mr-2" />
                <Link to="/profile" className="hover:text-primary transition-colors">
                  <span>{user.username}</span>
                </Link>
                <Icon name="chevron-down" className="icon ml-1 w-3 h-3" />
              </button>

              <div className="absolute right-0 mt-0.5 w-48 rounded-md shadow-lg bg-surface-dark border border-gray-800/50 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 hover:opacity-100 hover:visible z-50">
                <div className="py-1.5" role="menu">
                  <Link
                    to="/profile"
                    className="block px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200 my-0.5"
                    role="menuitem"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/library?tab=my_lists"
                    className="block px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200 my-0.5"
                    role="menuitem"
                  >
                    My Lists
                  </Link>
                  <Link
                    to="/sync"
                    className="block px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200 my-0.5"
                    role="menuitem"
                  >
                    Import Games
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200 my-0.5"
                    role="menuitem"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800/70 transition-colors duration-200 my-0.5"
                    role="menuitem"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut size={14} className="opacity-80" />
                      <span>Logout</span>
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
                  className="nav-link text-xs text-gray-300 hover:bg-gray-800 rounded-md px-3 py-1.5 flex items-center justify-between"
                  onClick={() => setIsOpen(false)}
                >
                  <span>{item.name}</span>
                </Link>
                <div className="ml-4 pl-2 border-l border-gray-700 space-y-1.5">
                  {item.dropdown.map((dropdownItem, dropdownIndex) => (
                    <Link
                      key={dropdownIndex}
                      to={dropdownItem.path}
                      className="nav-link text-xs text-gray-300 hover:bg-gray-800 rounded-md px-3 py-1.5 block hover:text-white"
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
                className="nav-link text-xs text-gray-300 hover:bg-gray-800 rounded-md px-3 py-1.5"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            )
          ))}
          {user ? (
            <>
              <Link to="/profile" className="nav-link text-xs text-gray-300 hover:bg-gray-800 rounded-md px-3 py-1.5" onClick={() => setIsOpen(false)}>
                My Profile
              </Link>
              <Link to="/library?tab=my_lists" className="nav-link text-xs text-gray-300 hover:bg-gray-800 rounded-md px-3 py-1.5" onClick={() => setIsOpen(false)}>
                My Lists
              </Link>
              <button onClick={handleLogout} className="nav-link text-xs text-left hover:bg-gray-800 rounded-md px-3 py-1.5">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link text-xs text-gray-300 hover:bg-gray-800 rounded-md px-3 py-1.5" onClick={() => setIsOpen(false)}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
