import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getByField, addItem, updateItem } from '@/lib/firebaseDb';
import { toast } from 'sonner';

export interface UserPreferences {
  id: string;
  user_id: string;
  language: string;
  region: string;
  timezone: string;
  currency: string;
  auto_backup: boolean;
  backup_frequency: string;
  last_backup_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    } else {
      setPreferences(null);
      setLoading(false);
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const results = await getByField<UserPreferences>('user_preferences', 'user_id', user.uid);

      if (results.length === 0) {
        const id = await addItem('user_preferences', {
          user_id: user.uid,
          language: 'en',
          region: 'IN',
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          auto_backup: false,
          backup_frequency: 'weekly',
          last_backup_at: null,
        });
        const newPref: UserPreferences = {
          id,
          user_id: user.uid,
          language: 'en',
          region: 'IN',
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          auto_backup: false,
          backup_frequency: 'weekly',
          last_backup_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setPreferences(newPref);
      } else {
        setPreferences(results[0]);
      }
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user || !preferences) return false;

    try {
      await updateItem('user_preferences', preferences.id, updates);
      setPreferences({ ...preferences, ...updates } as UserPreferences);
      toast.success('Preferences updated');
      return true;
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
      return false;
    }
  };

  return {
    preferences,
    loading,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
