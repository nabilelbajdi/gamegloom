import { createContext, useContext, useState, useEffect } from "react";
import API_URL from "../utils/apiConfig";
import { logoutApi } from "../api";

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

  // Check authentication status. The auth token is in an HttpOnly cookie, so we
  // simply ask /me with credentials and trust the response.
  const checkAuth = async () => {
    setLoading(true);

    // Retry only transient/network failures; a 401 is a definitive "logged out".
    let attempts = 0;
    const maxAttempts = 3;
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    while (attempts < maxAttempts) {
      try {
        const res = await fetch(`${API_URL}/me`, { credentials: "include" });

        if (res.status === 401 || res.status === 403) {
          setUser(null);
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error();

        setUser(await res.json());
        setLoading(false);
        return;
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) {
          console.error("Auth check failed after retries:", error);
          setUser(null);
          setLoading(false);
          return;
        }

        await delay(Math.min(1000 * Math.pow(2, attempts), 3000));
      }
    }
  };

  // Login: the /login request already set the auth cookie, so just load the user.
  const login = async () => {
    const res = await fetch(`${API_URL}/me`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch user data");
    setUser(await res.json());
  };

  // Logout: revoke the token + clear cookies server-side, then clear local state.
  const logout = async () => {
    await logoutApi();
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
