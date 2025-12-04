import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Automatically scrolls the window to the top whenever the route changes
const ScrollToTopOnMount = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTopOnMount; 