import React, { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 1500) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white/70 text-dark/80 hover:text-dark rounded-full shadow-lg cursor-pointer transition-all duration-300 ease-in-out z-50 flex items-center justify-center gap-1.5 text-xs font-semibold backdrop-blur-sm"
          aria-label="Scroll to top"
        >
          <span>Back to top</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      )}
    </>
  );
};

export default ScrollToTop; 