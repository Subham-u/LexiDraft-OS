import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@shared/schema';
// Keep the original implementation since we're not fully ready for Firebase auth
// We'll create a more robust implementation when all dependencies are in place

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
}

const defaultUser: User = {
  id: 1,
  uid: 'demo123',
  username: 'demo_user',
  email: 'demo@lexidraft.com',
  fullName: 'Demo User',
  role: 'user',
  avatar: '/assets/images/avatar.png',
  createdAt: new Date(),
  updatedAt: new Date()
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(defaultUser); // In production, this should start as null
  const [loading, setLoading] = useState(true);

  // For a production app, this would be replaced with real Firebase authentication
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Simulate a network check to see if user is logged in
        // In production, this would verify a token with the server
        const authToken = localStorage.getItem('authToken');
        
        // For demo/development, we always load the default user
        // In production, this would be based on real authentication
        if (process.env.NODE_ENV !== 'production') {
          console.log('DEVELOPMENT MODE: Using default user');
          setLoading(false);
          // Keep defaultUser for development
        } else {
          // In production, only set user if there's a valid token
          if (authToken) {
            // In production, validate token on server and get user data
            // For now, use default user in development
            setUser(defaultUser);
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // In production, log the user out on error
        if (process.env.NODE_ENV === 'production') {
          setUser(null);
        }
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // In production, these functions would use Firebase or another auth provider
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In production, this would verify credentials with a server
      // and store the returned JWT token
      if (process.env.NODE_ENV === 'production') {
        // Production login logic would go here
        // This would make an actual API call
        console.log('Production login would happen here');
        localStorage.setItem('authToken', 'demo-jwt-token');
      }
      
      setUser(defaultUser);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    // In production, this would invalidate the token on the server
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, this would create an account on the server
      // For now, just simulate the process
      if (process.env.NODE_ENV === 'production') {
        // Production signup logic would go here
        console.log('Production signup would happen here');
      }
      
      setUser({
        ...defaultUser,
        email,
        fullName: name
      });
      
      localStorage.setItem('authToken', 'demo-jwt-token');
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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

// Fallback auth context for when component is rendered outside provider
const fallbackAuthContext: AuthContextType = {
  user: defaultUser,
  isAuthenticated: true,
  loading: false,
  login: async () => true,
  logout: () => {},
  signUp: async () => true
};

export const useAuth = () => {
  try {
    const context = useContext(AuthContext);
    if (context === undefined) {
      console.warn('useAuth used outside AuthProvider - using fallback data');
      return fallbackAuthContext;
    }
    return context;
  } catch (error) {
    console.error('Error in useAuth:', error);
    return fallbackAuthContext;
  }
};