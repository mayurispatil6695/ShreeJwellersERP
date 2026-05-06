import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getByField } from '@/lib/firebaseDb';

export type AppRole = 'admin' | 'moderator' | 'user';

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRoles();
    } else {
      setRoles([]);
      setLoading(false);
    }
  }, [user]);

  const fetchRoles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getByField<{ role: AppRole; user_id: string }>('user_roles', 'user_id', user.uid);
      setRoles(data.length > 0 ? data.map(r => r.role) : ['user']);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles(['user']);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = roles.includes('admin');
  const isModerator = roles.includes('moderator') || isAdmin;

  return {
    roles,
    isAdmin,
    isModerator,
    loading,
    refetch: fetchRoles,
  };
}
