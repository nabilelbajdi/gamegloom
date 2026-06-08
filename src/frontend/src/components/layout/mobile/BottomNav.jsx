import { NavLink } from "react-router-dom";
import { Home, Compass, Library, User } from "lucide-react";

const TABS = [
  { to: "/", label: "Home", Icon: Home, end: true },
  { to: "/discover", label: "Discover", Icon: Compass, end: false },
  { to: "/library", label: "Library", Icon: Library, end: false },
  { to: "/profile", label: "You", Icon: User, end: false },
];

// Fixed mobile tab bar. Hidden on desktop; App.jsx only renders it below 768px,
// and md:hidden is a defensive guard. Bottom padding clears the iOS home indicator.
export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 flex md:hidden h-16 bg-surface-dark border-t border-gray-800/50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] transition-colors ${
              isActive ? "text-primary" : "text-gray-400"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
