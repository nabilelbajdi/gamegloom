import { Link } from "react-router-dom";

const variants = {
  nav: "btn-nav",
  hero: "btn-hero",
  subscribe: "btn-subscribe",
};

export default function Button({ to, label, variant = "nav", onClick }) {
  return (
    <Link to={to} className={variants[variant]} onClick={onClick}>
      {label}
    </Link>
  );
}
