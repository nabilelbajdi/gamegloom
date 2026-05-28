import React, { useState } from "react";
import { Link } from "react-router-dom";
import API_URL from "../utils/apiConfig";
import { motion } from "framer-motion";
import { Mail, AlertCircle, ChevronLeft, CheckCircle } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Something went wrong. Please try again.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen h-screen bg-[var(--bg-base)] flex relative overflow-hidden">
      <Link
        to="/login"
        className="absolute top-6 left-6 text-white hover:text-primary z-20 flex items-center gap-2 transition-colors duration-200"
      >
        <ChevronLeft size={20} />
        <span className="font-medium">Back to Login</span>
      </Link>

      {/* Background */}
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
          <div className="bg-surface-dark/90 backdrop-blur-sm border border-gray-800/50 p-6 rounded-xl shadow-xl">
            <div className="mb-5 text-center">
              <h1 className="text-xl font-bold text-white mb-1">Forgot Password?</h1>
              <p className="text-gray-400 text-xs">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {submitted ? (
              <motion.div
                className="flex flex-col items-center gap-3 py-4 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle size={40} className="text-primary" />
                <p className="text-white font-medium text-sm">Check your inbox</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  If <span className="text-white">{email}</span> is registered, you'll receive a
                  reset link within a few minutes.
                </p>
                <Link
                  to="/login"
                  className="mt-2 text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Back to Login
                </Link>
              </motion.div>
            ) : (
              <>
                {error && (
                  <motion.div
                    className="bg-red-900/30 border border-red-500/50 text-white p-3 rounded-lg mb-4 flex items-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertCircle className="text-red-400 mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="text-xs text-red-100">{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-gray-300 mb-1">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Mail size={16} className="text-primary" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-surface-dark text-sm text-white rounded-md pl-10 pr-4 py-2.5 focus:outline-none border border-gray-800/50 focus:border-primary/50 shadow-sm"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-2.5 px-4 flex justify-center items-center rounded-md text-sm font-semibold transition-all
                      ${isLoading
                        ? "bg-primary/70 cursor-not-allowed text-black/70"
                        : "bg-primary hover:bg-primary/90 text-black shadow-lg shadow-primary/20"
                      }`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>

                <div className="mt-4 text-center text-xs">
                  <p className="text-gray-400">
                    Remember your password?{" "}
                    <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
