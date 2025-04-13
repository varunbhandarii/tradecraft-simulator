"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
  ReactNode,
  useCallback,
} from "react";
import apiClient from "@/services/apiClient";

interface UserInfo {
  id: number;
  username: string;
  email: string;
}

// Define the shape of the context value
interface AuthContextType {
  token: string | null;
  user: UserInfo | null;
  isLoading: boolean; // To track initial auth check
  login: (newToken: string) => Promise<void>; // Make login async to fetch user
  logout: () => void;
}

// Create the context with an initial undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading until checked

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("tokenType");
    setToken(null);
    setUser(null);
  }, []);

  // Function to fetch user data using the token
  const fetchUser = useCallback(
    async (currentToken: string) => {
      if (!currentToken) return; // No need to fetch if no token
      try {
        const response = await apiClient.get<UserInfo>("/users/me");
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user info, logging out.", error);
        // Token likely invalid/expired, trigger logout
        logout();
      }
    },
    [logout]
  ); // Depend on logout to avoid stale closures

  // Check localStorage for token on initial mount
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const storedToken = localStorage.getItem("accessToken");
      if (storedToken) {
        setToken(storedToken);
        await fetchUser(storedToken); // Validate token and fetch user
      } else {
        setToken(null); // Ensure token state is null if nothing in storage
        setUser(null); // Ensure user state is null if no token
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, [fetchUser]); // Depend on fetchUser callback

  // Login function
  const login = useCallback(
    async (newToken: string) => {
      setIsLoading(true); // Indicate loading while fetching user
      localStorage.setItem("accessToken", newToken);
      setToken(newToken);
      await fetchUser(newToken); // Fetch user info immediately after login
      setIsLoading(false);
    },
    [fetchUser]
  );

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      login,
      logout,
    }),
    [token, user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
