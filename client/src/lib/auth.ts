/**
 * Authentication utilities for the client
 */
import { useState, useEffect, createContext, useContext } from 'react';

// Auth context type
interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<any>;
}

// Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => null,
  logout: async () => {},
  signUp: async () => null,
});

// Local storage keys
const TOKEN_KEY = 'lexidraft-auth-token';
const USER_KEY = 'lexidraft-user';

// Export auth token getter
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

// Set auth token
export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

// Clear auth token
export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Get user data
export function getUserData(): any | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const userData = localStorage.getItem(USER_KEY);
  if (!userData) {
    return null;
  }
  
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error parsing user data from localStorage', error);
    return null;
  }
}

// Set user data
export function setUserData(user: any): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Clear user data
export function clearUserData(): void {
  localStorage.removeItem(USER_KEY);
}

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check if user is authenticated
  const isAuthenticated = !!user;
  
  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = getUserData();
      const token = getAuthToken();
      
      if (token && storedUser) {
        // Validate token with the server if needed
        // For now, just set the user from localStorage
        setUser(storedUser);
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, []);
  
  // Login method
  const login = async (email: string, password: string) => {
    try {
      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Save token and user data to localStorage
      setAuthToken(data.token);
      setUserData(data.user);
      
      // Update state
      setUser(data.user);
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  // Logout method
  const logout = async () => {
    try {
      // Call logout API if needed
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      clearAuthToken();
      clearUserData();
      setUser(null);
    }
  };
  
  // Sign up method
  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Call signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        signUp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Auth hook
export function useAuth() {
  return useContext(AuthContext);
}