import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API_URL from "../utils/apiConfig";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, ChevronLeft } from "lucide-react";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing verification link.");
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(`${API_URL}/verify-email?token=${encodeURIComponent(token)}`, {
          method: "POST",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.detail || "Verification failed.");
        }
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setMessage(err.message);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen h-screen bg-[var(--bg-base)] flex relative overflow-hidden">
      <Link
        to="/login"
        className="absolute top-6 left-6 text-white hover:text-primary z-20 flex items-center gap-2 transition-colors duration-200"
      >
        <ChevronLeft size={20} />
        <span className="font-medium">Back to Login</span>
      </Link>

      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-black/80 to-black/60 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.03 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2 }}
        >
          <img
            src="/images/zelda.jpg"
            alt="Gaming Background"
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        </motion.div>
      </div>

      <div className="w-full flex flex-col items-center justify-center z-10">
        <motion.div
          className="w-full max-w-sm px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-surface-dark/90 backdrop-blur-sm border border-gray-800/50 p-6 rounded-xl shadow-xl text-center">

            {status === "loading" && (
              <div className="py-6 flex flex-col items-center gap-3">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-gray-400 text-sm">Verifying your email...</p>
              </div>
            )}

            {status === "success" && (
              <motion.div
                className="flex flex-col items-center gap-3 py-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle size={40} className="text-primary" />
                <p className="text-white font-medium text-sm">Email verified!</p>
                <p className="text-gray-400 text-xs">Your account is now fully active.</p>
                <Link
                  to="/"
                  className="mt-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-black text-sm font-semibold rounded-lg transition-colors"
                >
                  Go to GameGloom
                </Link>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                className="flex flex-col items-center gap-3 py-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <AlertCircle size={40} className="text-red-400" />
                <p className="text-white font-medium text-sm">Verification failed</p>
                <p className="text-gray-400 text-xs">{message}</p>
                <Link
                  to="/settings"
                  className="mt-2 text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Resend verification email
                </Link>
              </motion.div>
            )}

          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
