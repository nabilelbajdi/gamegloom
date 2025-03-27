import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLoadingBar } from "../App";
import API_URL from "../utils/apiConfig";
import { motion } from "framer-motion";
import { Eye, EyeOff, UserCheck, Lock, AlertCircle, ChevronLeft } from "lucide-react";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const loadingBar = useLoadingBar();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    loadingBar.start();

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      const data = await response.json();
      await login(data.token, data);
      loadingBar.complete();
      navigate("/");
    } catch (err) {
      setError(err.message);
      loadingBar.complete();
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen h-screen bg-black flex relative overflow-hidden">
      {/* Back to Home Link */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 text-white hover:text-primary z-20 flex items-center gap-2 transition-colors duration-200"
      >
        <ChevronLeft size={20} />
        <span className="font-medium">Back to Home</span>
      </Link>
      
      {/* Background Image */}
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

      {/* Center Content */}
      <div className="w-full flex flex-col items-center justify-center z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center mb-4 max-w-md px-4"
        >
          <h2 className="text-3xl font-bold text-white">Welcome to GameGloom</h2>
          <p className="text-lg mt-2 text-gray-300">
            Track games, share reviews, and join our community
          </p>
        </motion.div>

        <motion.div
          className="w-full max-w-sm px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-surface-dark/90 backdrop-blur-sm border border-gray-800/50 p-4 rounded-xl shadow-xl">
            <div className="mb-4 text-center">
              <h1 className="text-xl font-bold text-white mb-1">Sign In</h1>
              <p className="text-gray-400 text-xs">Enter your credentials to access your account</p>
            </div>
            
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
                <label htmlFor="username" className="block text-xs font-medium text-gray-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <UserCheck size={16} className="text-primary" />
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-surface-dark text-sm text-white rounded-md pl-10 pr-4 py-2.5 focus:outline-none border border-gray-800/50 focus:border-primary/50 shadow-sm"
                    placeholder="Your username"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock size={16} className="text-primary" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-surface-dark text-sm text-white rounded-md pl-10 pr-10 py-2.5 focus:outline-none border border-gray-800/50 focus:border-primary/50 shadow-sm"
                    placeholder="Your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded bg-gray-800 border-gray-700 text-primary focus:ring-primary/50"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-300">
                    Remember me
                  </label>
                </div>
                <div className="text-xs">
                  <a href="#" className="text-primary hover:text-primary/80">
                    Forgot password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 px-4 flex justify-center items-center rounded-md text-sm font-semibold transition-all 
                  ${isLoading 
                    ? 'bg-primary/70 cursor-not-allowed text-black/70' 
                    : 'bg-primary hover:bg-primary/90 text-black shadow-lg shadow-primary/20'
                  }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-surface-dark text-xs text-gray-500">OR</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-3">
                <button className="flex justify-center items-center py-1.5 px-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.72 17.56V20.34H19.28C21.36 18.42 22.56 15.59 22.56 12.25Z" fill="#4285F4"/>
                    <path d="M12 23C14.97 23 17.46 22 19.28 20.34L15.72 17.56C14.75 18.2 13.48 18.58 12 18.58C9.12 18.58 6.69 16.66 5.81 14.09H2.13V16.95C3.93 20.58 7.7 23 12 23Z" fill="#34A853"/>
                    <path d="M5.81 14.09C5.58 13.44 5.45 12.74 5.45 12C5.45 11.26 5.58 10.56 5.81 9.91V7.05H2.13C1.41 8.57 1 10.23 1 12C1 13.77 1.41 15.43 2.13 16.95L5.81 14.09Z" fill="#FBBC05"/>
                    <path d="M12 5.42C13.62 5.42 15.06 5.95 16.21 7.05L19.36 3.9C17.45 2.1 14.97 1 12 1C7.7 1 3.93 3.42 2.13 7.05L5.81 9.91C6.69 7.34 9.12 5.42 12 5.42Z" fill="#EA4335"/>
                  </svg>
                </button>
                <button className="flex justify-center items-center py-1.5 px-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.5 1.5C8.7 1.5 7.5 2.7 7.5 4.5C7.5 5.4 7.9 6.2 8.5 6.7C9.1 7.2 9.8 7.5 10.5 7.5C11.3 7.5 12.0 7.2 12.6 6.7C13.2 6.2 13.5 5.4 13.5 4.5C13.5 3.7 13.2 3.0 12.6 2.4C12.0 1.8 11.3 1.5 10.5 1.5ZM3 3C2.2 3 1.5 3.3 0.9 3.9C0.3 4.5 0 5.2 0 6.0C0 6.8 0.3 7.5 0.9 8.1C1.5 8.7 2.2 9.0 3.0 9.0C3.8 9.0 4.5 8.7 5.1 8.1C5.7 7.5 6.0 6.8 6.0 6.0C6.0 5.2 5.7 4.5 5.1 3.9C4.5 3.3 3.8 3.0 3.0 3.0ZM18.0 3.0C17.2 3.0 16.5 3.3 15.9 3.9C15.3 4.5 15.0 5.2 15.0 6.0C15.0 6.8 15.3 7.5 15.9 8.1C16.5 8.7 17.2 9.0 18.0 9.0C18.8 9.0 19.5 8.7 20.1 8.1C20.7 7.5 21.0 6.8 21.0 6.0C21.0 5.2 20.7 4.5 20.1 3.9C19.5 3.3 18.8 3.0 18.0 3.0ZM3.0 10.5C2.2 10.5 1.5 10.8 0.9 11.4C0.3 12.0 0 12.7 0 13.5V18.0C0 19.0 0.4 20.0 1.2 20.7C1.9 21.5 2.9 22.0 4.0 22.0H8.5C8.5 21.2 8.8 20.5 9.4 19.9C10.0 19.3 10.7 19.0 11.5 19.0H12.5C13.3 19.0 14.0 19.3 14.6 19.9C15.2 20.5 15.5 21.2 15.5 22.0H20.0C21.0 22.0 22.0 21.6 22.7 20.8C23.5 20.1 24.0 19.1 24.0 18.0V13.5C24.0 12.7 23.7 12.0 23.1 11.4C22.5 10.8 21.8 10.5 21.0 10.5H17.9C17.8 10.5 17.6 10.5 17.5 10.5C16.9 10.6 16.3 10.8 15.8 11.1C15.4 11.4 15.0 11.7 14.8 12.1C14.3 12.9 13.5 13.5 12.6 13.8C12.5 13.2 12.3 12.5 12.0 12.0C11.6 11.2 11.0 10.6 10.3 10.1C9.8 9.8 9.3 9.6 8.7 9.5C8.6 9.5 8.4 9.5 8.3 9.5H3.0Z" fill="#1877F2"/>
                  </svg>
                </button>
                <button className="flex justify-center items-center py-1.5 px-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.4765 1.5C5.86377 1.5 2.09998 5.26379 2.09998 9.87653C2.09998 13.575 4.56873 16.6839 7.98748 17.6812C8.48749 17.775 8.69999 17.4712 8.69999 17.2125C8.69999 16.9837 8.68499 16.1625 8.68499 15.4837C6.24997 15.9338 5.68503 14.3887 5.68503 14.3887C5.24998 13.4362 4.61246 13.1625 4.61246 13.1625C3.72754 12.6675 4.68745 12.6675 4.68745 12.6675C5.67747 12.7425 6.17998 13.5637 6.17998 13.5637C7.05749 14.7562 8.39983 14.4375 8.73747 14.1787C8.82747 13.65 9.08249 13.2862 9.35249 13.0724C7.37993 12.8662 5.31244 12.1875 5.31244 8.98369C5.31244 8.03112 5.67743 7.24998 6.19497 6.64371C6.09002 6.39995 5.76744 5.51869 6.29995 4.31865C6.29995 4.31865 7.12495 4.06243 8.68494 5.0849C9.38993 4.87371 10.1449 4.76247 10.8975 4.76247C11.6501 4.76247 12.405 4.87371 13.11 5.0849C14.67 4.06243 15.495 4.31865 15.495 4.31865C16.0275 5.51869 15.705 6.39995 15.6 6.64371C16.125 7.24998 16.4825 8.03112 16.4825 8.98369C16.4825 12.1875 14.415 12.8587 12.435 13.0724C12.7725 13.3387 13.0649 13.8487 13.0649 14.6363C13.0649 15.7613 13.0499 16.8863 13.0499 17.2125C13.0499 17.4712 13.2624 17.775 13.7624 17.6812C17.1812 16.6839 19.65 13.575 19.65 9.87653C19.65 5.26379 15.8862 1.5 10.4765 1.5Z" fill="white"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-4 text-center text-xs">
              <p className="text-gray-400">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:text-primary/80 font-medium">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;