import * as React from "react";
import { api } from "../utils/api";

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  ssoToken: string | null;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [ssoToken, setSsoToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isClient, setIsClient] = React.useState(false);

  // Ensure we're on the client side before accessing localStorage
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (!isClient) return;

    // Check for token in localStorage on initial load
    const token = localStorage.getItem("sso_token");
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, [isClient]);

  const verifyToken = async (token: string) => {
    try {
      setIsLoading(true);
      const response = await api.verifyToken(token);
      
      if (response.valid || response.success) {
        setUser(response.user);
        setSsoToken(token);
        if (isClient) {
          localStorage.setItem("sso_token", token);
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!ssoToken) return;
    
    try {
      const response = await api.getUserProfile(ssoToken);
      setUser(response.user || response);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      // If token is invalid, logout
      if (error instanceof Error && error.message.includes('401')) {
        logout();
      }
    }
  };

  const login = (token: string) => {
    setSsoToken(token);
    if (isClient) {
      localStorage.setItem("sso_token", token);
    }
    verifyToken(token);
  };

  const logout = () => {
    setUser(null);
    setSsoToken(null);
    if (isClient) {
      localStorage.removeItem("sso_token");
    }
    setIsLoading(false);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    ssoToken,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
