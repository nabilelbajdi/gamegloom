import { Link } from "react-router-dom";
import PropTypes from 'prop-types';

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

Button.propTypes = {
  to: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['nav', 'hero', 'subscribe']),
  onClick: PropTypes.func
};
