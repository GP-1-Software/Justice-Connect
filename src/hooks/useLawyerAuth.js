import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useLawyerAuth() {
  const [loading, setLoading] = useState(true);
  const [lawyer, setLawyer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 1) Prefer localStorage (since app stores lawyer there on login)
        const storedStr = localStorage.getItem('user');
        if (storedStr) {
          const stored = JSON.parse(storedStr);
          if (stored && stored.user_type === 'lawyer') {
            if (isMounted) setLawyer(stored);
            return;
          }
        }

        // 2) Fallback to Supabase auth session (if used elsewhere)
        const { data: sessionData } = await supabase.auth.getSession();
        const email = sessionData?.session?.user?.email;
        if (email) {
          const { data, error: dbError } = await supabase
            .from('lawyers')
            .select('*')
            .eq('email', email)
            .single();
          if (dbError) throw dbError;
          if (isMounted) setLawyer(data);
          return;
        }

        if (isMounted) setLawyer(null);
      } catch (e) {
        if (isMounted) setError(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  return { loading, lawyer, error };
}


