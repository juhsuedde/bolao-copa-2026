import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

type UserRole = 'admin' | 'user' | null;

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const isMockMode = import.meta.env.VITE_USE_MOCK === 'true';
    
    if (isMockMode) {
      // No modo demo, ninguém vê o painel admin
      setRole(null);
      setLoading(false);
      return;
    }

    async function checkRole() {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('has_role', { p_user_uuid: user.id, p_role_name: 'admin' });
        
        if (error) {
          console.error('Error checking role:', error);
          setRole(null);
        } else {
          setRole(data ? 'admin' : null);
        }
      } catch (err) {
        console.error('Role check failed:', err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    checkRole();
  }, [user]);

  const isAdmin = role === 'admin';

  return { role, isAdmin, loading };
}