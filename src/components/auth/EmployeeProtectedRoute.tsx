import { Navigate } from 'react-router-dom';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { Loader2 } from 'lucide-react';

interface EmployeeProtectedRouteProps {
  children: React.ReactNode;
}

export function EmployeeProtectedRoute({ children }: EmployeeProtectedRouteProps) {
  const { employee, loading } = useEmployeeAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
