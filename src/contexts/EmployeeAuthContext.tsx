import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  email: string | null;
  department: string | null;
}

interface EmployeeAuthContextType {
  employee: Employee | null;
  loading: boolean;
  signIn: (employeeId: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType | undefined>(undefined);

const SESSION_KEY = 'employee_session';

type LocalEmployeeSession = {
  employee: Employee;
  session_token: string;
  expires_at: string;
};

export function EmployeeAuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateSession();
  }, []);

  const validateSession = async () => {
    const sessionRaw = localStorage.getItem(SESSION_KEY);
    if (!sessionRaw) {
      setLoading(false);
      return;
    }

    try {
      const sessionData = JSON.parse(sessionRaw) as LocalEmployeeSession;

      if (!sessionData.employee || !sessionData.expires_at) {
        localStorage.removeItem(SESSION_KEY);
        setEmployee(null);
        setLoading(false);
        return;
      }

      if (new Date(sessionData.expires_at) < new Date()) {
        localStorage.removeItem(SESSION_KEY);
        setEmployee(null);
        setLoading(false);
        return;
      }

      // Validate session token with backend
      try {
        const { data, error } = await supabase.functions.invoke('employee-auth', {
          body: { session_token: sessionData.session_token },
          headers: { 'Content-Type': 'application/json' },
        });

        // Parse response if it's a string
        const response = typeof data === 'string' ? JSON.parse(data) : data;

        if (error || !response?.valid) {
          localStorage.removeItem(SESSION_KEY);
          setEmployee(null);
          setLoading(false);
          return;
        }

        setEmployee(response.employee || sessionData.employee);
      } catch {
        // If backend validation fails, still use local session if not expired
        setEmployee(sessionData.employee);
      }
    } catch (error) {
      console.error('Session validation error:', error);
      localStorage.removeItem(SESSION_KEY);
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (employeeId: string, password: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('employee-auth', {
        body: { employee_id: employeeId, password },
        headers: { 'Content-Type': 'application/json' },
      });

      // Parse response if it's a string
      const response = typeof data === 'string' ? JSON.parse(data) : data;

      if (fnError) {
        return { error: new Error(response?.error || fnError.message || 'Login failed') };
      }

      if (response?.error) {
        return { error: new Error(response.error) };
      }

      if (!response?.success || !response?.employee) {
        return { error: new Error('Invalid response from server') };
      }

      const emp: Employee = {
        id: response.employee.id,
        employee_id: response.employee.employee_id,
        name: response.employee.name,
        email: response.employee.email || null,
        department: response.employee.department || null,
      };

      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          employee: emp,
          session_token: response.session_token,
          expires_at: response.expires_at,
        } satisfies LocalEmployeeSession)
      );

      setEmployee(emp);
      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.message || 'Login failed') };
    }
  };

  const signOut = async () => {
    const sessionRaw = localStorage.getItem(SESSION_KEY);
    if (sessionRaw) {
      try {
        const sessionData = JSON.parse(sessionRaw) as LocalEmployeeSession;
        await supabase.functions.invoke('employee-auth', {
          body: { session_token: sessionData.session_token },
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    localStorage.removeItem(SESSION_KEY);
    setEmployee(null);
  };

  return (
    <EmployeeAuthContext.Provider value={{ employee, loading, signIn, signOut, isAuthenticated: !!employee }}>
      {children}
    </EmployeeAuthContext.Provider>
  );
}

export function useEmployeeAuth() {
  const context = useContext(EmployeeAuthContext);
  if (context === undefined) {
    throw new Error('useEmployeeAuth must be used within an EmployeeAuthProvider');
  }
  return context;
}
