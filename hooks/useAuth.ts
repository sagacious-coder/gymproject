import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

// Default guest athlete used during development if not authenticated
const DEFAULT_GUEST_USER: AuthUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'athlete@omnifit.dev',
  name: 'Athlete One',
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(DEFAULT_GUEST_USER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (data?.session?.user && isMounted) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email,
            name: data.session.user.user_metadata?.full_name || 'Athlete',
          });
        }
      } catch (err) {
        console.warn('Supabase auth getSession notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || 'Athlete',
        });
      } else {
        setUser(DEFAULT_GUEST_USER);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
