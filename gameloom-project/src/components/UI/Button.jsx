import { Link } from "react-router-dom";
import PropTypes from 'prop-types';

const variants = {
  nav: "btn-nav relative px-4 uppercase text-xs transition-all duration-300",
  hero: "btn-hero",
  subscribe: "btn-subscribe",
  primary: "inline-flex items-center justify-center px-4 py-2 bg-primary text-dark font-medium rounded-lg hover:bg-primary/90 transition-colors duration-300",
  secondary: "inline-flex items-center justify-center px-4 py-2 bg-dark/50 backdrop-blur-sm text-light font-medium rounded-lg hover:bg-dark/70 hover:text-primary transition-colors duration-300 border border-primary/20"
};

export default function Button({ to, label, variant = "nav", onClick, icon }) {
  return (
    <Link to={to} className={variants[variant]} onClick={onClick}>
      {icon}
      {label}
    </Link>
  );
}

Button.propTypes = {
  to: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['nav', 'hero', 'subscribe', 'primary', 'secondary']),
  onClick: PropTypes.func,
  icon: PropTypes.element
};
