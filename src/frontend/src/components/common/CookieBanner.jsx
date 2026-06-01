import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { hasDecided, setConsent, CONSENT_CHANGED_EVENT } from "../../utils/consent";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasDecided());
    const onChange = () => setVisible(!hasDecided());
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
  }, []);

  const handleAccept = () => setConsent("accepted");
  const handleDecline = () => setConsent("declined");

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-0 left-0 right-0 z-[100] bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-4 py-5 shadow-2xl"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="flex-1">
          <h2 className="text-white text-base font-semibold mb-1">Welcome to GameGloom</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            We use local storage to keep you signed in (essential) and to remember small
            preferences like your view mode, recently viewed games, and the "Remember me"
            option on login. We do not use tracking, analytics, or advertising cookies.
            See our{" "}
            <Link to="/privacy" className="text-primary underline hover:text-primary/80">
              Privacy Policy
            </Link>
            {" "}for details.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleDecline}
            className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 sm:flex-none px-4 py-2 bg-primary hover:bg-primary/90 text-dark text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
