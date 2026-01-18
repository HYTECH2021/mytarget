import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const checkAdmin = async () => {
      // Check both admin_users table and profile role
      const [adminUserRes, profileRes] = await Promise.all([
        supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      const isAdminUser = !!adminUserRes.data;
      const isAdminRole = profileRes.data?.role === 'admin';

      setIsAdmin(isAdminUser || isAdminRole);
      setLoading(false);
    };

    checkAdmin();
  }, [user]);

  return { isAdmin, loading };
}
