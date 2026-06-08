import { Link } from "react-router-dom";
import { Search, User } from "lucide-react";

// Slim sticky mobile header: brand (left), search + profile (right).
// Top padding clears the notch/status bar via the safe-area inset.
export default function MobileTopBar() {
  return (
    <header
      className="sticky top-0 z-40 flex md:hidden items-center justify-between h-14 px-4 bg-surface-dark/95 backdrop-blur border-b border-gray-800/50"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <Link to="/" className="cursor-pointer" aria-label="GameGloom home">
        <img src="/images/logo.svg" alt="GameGloom" className="h-6" />
      </Link>
      <div className="flex items-center gap-1">
        <Link to="/search" aria-label="Search" className="p-2 text-gray-300 hover:text-light transition-colors">
          <Search size={22} />
        </Link>
        <Link to="/profile" aria-label="Profile" className="p-2 text-gray-300 hover:text-light transition-colors">
          <User size={22} />
        </Link>
      </div>
    </header>
  );
}
