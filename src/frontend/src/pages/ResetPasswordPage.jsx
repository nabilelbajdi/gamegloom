import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API_URL from "../utils/apiConfig";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, AlertCircle, ChevronLeft, CheckCircle } from "lucide-react";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new reset link.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || "Failed to reset password. The link may have expired.");
      }

      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
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
              <h1 className="text-xl font-bold text-white mb-1">Set New Password</h1>
              <p className="text-gray-400 text-xs">Choose a strong password for your account.</p>
            </div>

            {success ? (
              <motion.div
                className="flex flex-col items-center gap-3 py-4 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle size={40} className="text-primary" />
                <p className="text-white font-medium text-sm">Password updated!</p>
                <p className="text-gray-400 text-xs">
                  Redirecting you to login...
                </p>
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
                    <label htmlFor="password" className="block text-xs font-medium text-gray-300 mb-1">
                      New password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Lock size={16} className="text-primary" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-surface-dark text-sm text-white rounded-md pl-10 pr-10 py-2.5 focus:outline-none border border-gray-800/50 focus:border-primary/50 shadow-sm"
                        placeholder="At least 8 characters"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300 focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm" className="block text-xs font-medium text-gray-300 mb-1">
                      Confirm password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Lock size={16} className="text-primary" />
                      </div>
                      <input
                        type={showConfirm ? "text" : "password"}
                        id="confirm"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className="w-full bg-surface-dark text-sm text-white rounded-md pl-10 pr-10 py-2.5 focus:outline-none border border-gray-800/50 focus:border-primary/50 shadow-sm"
                        placeholder="Repeat your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300 focus:outline-none"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !token}
                    className={`w-full py-2.5 px-4 flex justify-center items-center rounded-md text-sm font-semibold transition-all
                      ${isLoading || !token
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
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
