// Temporary auth context for development
const mockAuthContext = {
  user: { id: 1, fullName: 'Demo User', displayName: 'Demo User' },
};

// Mock useAuth hook until the real one is fixed
const useAuth = () => mockAuthContext;

interface DashboardHeaderProps {
  date?: string;
}

export default function DashboardHeader({ date }: DashboardHeaderProps) {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(" ")[0] || "there";
  const currentDate = date || new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  return (
    <div className="mb-8">
      <h1 className="font-urbanist text-2xl font-bold text-gray-900">Welcome back, {firstName}!</h1>
      <p className="mt-1 text-sm text-gray-600">{currentDate}</p>
    </div>
  );
}
