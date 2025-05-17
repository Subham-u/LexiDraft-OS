// Temporary auth context for development
const mockAuthContext = {
  user: { id: 1, fullName: 'Demo User', displayName: 'Demo User' },
  isAuthenticated: true,
  loading: false,
};

// Mock useAuth hook until the real one is fixed
const useAuth = () => mockAuthContext;
import { useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user && location !== "/login") {
      setLocation("/login");
    }
  }, [user, loading, location, setLocation]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}