import { Search, Bell, User, Menu, X, BookmarkPlus, ChevronDown } from "lucide-react";

const icons = {
  search: Search,
  bell: Bell,
  user: User,
  menu: Menu,
  close: X,
  "bookmark-plus": BookmarkPlus,
  "chevron-down": ChevronDown,
};

export default function Icon({ name, className }) {
  const IconComponent = icons[name];
  return IconComponent ? <IconComponent className={`w-4 h-4 ${className}`} /> : null;
}
