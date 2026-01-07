import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useLawyerAuth() {
  const [loading, setLoading] = useState(true);
  const [lawyer, setLawyer] = useState(null);
  const [error, setError] = useState(null);

  const loadLawyer = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Prefer localStorage (since app stores lawyer there on login)
      const storedStr = localStorage.getItem('user');
      if (storedStr) {
        const stored = JSON.parse(storedStr);
        if (stored && stored.user_type === 'lawyer') {
          // Fetch fresh data from database
          const { data, error: dbError } = await supabase
            .from('lawyers')
            .select('*')
            .eq('lawyer_id', stored.lawyer_id)
            .single();

          if (!dbError && data) {
            setLawyer(data);
            // Update localStorage with fresh data
            localStorage.setItem('user', JSON.stringify({ ...data, user_type: 'lawyer' }));
            return;
          }
          setLawyer(stored);
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
        setLawyer(data);
        return;
      }

      setLawyer(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLawyer();
  }, []);

  const refreshLawyer = async () => {
    await loadLawyer();
  };

  const signOut = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('user');
      // Sign out from Supabase
      await supabase.auth.signOut();
      // Clear lawyer state
      setLawyer(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return { loading, lawyer, error, refreshLawyer, setLawyer, signOut };
}


