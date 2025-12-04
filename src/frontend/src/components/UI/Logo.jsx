import { Link } from "react-router-dom";

const Logo = ({ className = "h-14 w-auto" }) => {
  return (
    <Link to="/" className={`logo flex items-center ${className}`}>
      <img
        src="/images/logo.svg"
        alt="GameGloom Logo"
        className="w-auto h-full object-contain"
      />
    </Link>
  );
};

export default Logo;
