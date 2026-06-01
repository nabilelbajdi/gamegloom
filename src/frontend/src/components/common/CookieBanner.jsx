import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "cookieConsentAcknowledged";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-0 left-0 right-0 z-[100] bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-4 py-4 shadow-2xl"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
        <p className="text-sm text-gray-300 flex-1 leading-relaxed">
          GameGloom uses local storage to keep you signed in and remember basic preferences.
          We do not use tracking or advertising cookies. See our{" "}
          <Link to="/privacy" className="text-primary underline hover:text-primary/80">
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
        <button
          onClick={handleAccept}
          className="px-4 py-2 bg-primary text-dark text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
