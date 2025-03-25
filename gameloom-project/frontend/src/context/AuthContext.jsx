import { createContext, useContext, useState, useEffect } from "react";
import API_URL from "../utils/apiConfig";

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status
  const checkAuth = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    
    if (!token) {
      setLoading(false);
      return;
    }

    // Add retry logic
    let attempts = 0;
    const maxAttempts = 3;
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    while (attempts < maxAttempts) {
      try {
        const res = await fetch(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error();
        
        const userData = await res.json();
        setUser(userData);
        setLoading(false);
        return;
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) {
          console.error("Auth check failed after retries:", error);
          localStorage.removeItem("token");
          setUser(null);
          setLoading(false);
          return;
        }

        await delay(Math.min(1000 * Math.pow(2, attempts), 3000));
      }
    }
  };

  // Login function
  const login = async (token, userData) => {
    try {
      // First save the token
      localStorage.setItem("token", token);
      
      // Then fetch complete user data
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to fetch user data");
      
      const completeUserData = await res.json();
      setUser(completeUserData);
    } catch (error) {
      // If anything fails, clean up and rethrow
      localStorage.removeItem("token");
      setUser(null);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Value object to be provided to consumers
  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 