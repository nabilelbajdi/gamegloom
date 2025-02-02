import { Search, Bell, User } from "lucide-react";

const icons = {
  search: Search,
  bell: Bell,
  user: User,
};

export default function Icon({ name, className }) {
  const IconComponent = icons[name];
  return <IconComponent className={className} />;
}
