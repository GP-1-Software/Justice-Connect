import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

// Create Auth Context
const ClientAuthContext = createContext();

// Custom hook to use auth context
export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
};

// Auth Provider Component
export const ClientAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check localStorage first for existing session
    checkLocalStorageAuth();

    // Listen for localStorage changes (when user logs in from another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        checkLocalStorageAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const checkLocalStorageAuth = () => {
    try {
      const storedUser = localStorage.getItem('user');
      console.log('Checking localStorage:', storedUser);
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        console.log('Parsed user data:', userData);
        
        if (userData.user_type === 'client') {
          console.log('Setting client auth state');
          setUserProfile(userData);
          setUser({ id: userData.user_id, email: userData.email });
        }
      } else {
        console.log('No user found in localStorage');
      }
    } catch (error) {
      console.error('Error checking localStorage auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error getting session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', userId)
        .eq('user_type', 'client')
        .single();

      if (error) {
        // If user not found in users table, check if it's a lawyer
        const { data: lawyerData, error: lawyerError } = await supabase
          .from('lawyers')
          .select('*')
          .eq('email', userId)
          .single();

        if (lawyerError) {
          console.error('User profile not found:', error);
          return;
        }

        setUserProfile({
          ...lawyerData,
          user_type: 'lawyer'
        });
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is a client
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .eq('user_type', 'client')
          .single();

        if (userError) {
          // User is not a client, redirect to appropriate dashboard
          const { data: lawyerData } = await supabase
            .from('lawyers')
            .select('*')
            .eq('email', email)
            .single();

          if (lawyerData) {
            // User is a lawyer, redirect to lawyer dashboard
            navigate('/lawyer/dashboard');
            return { success: false, message: 'تم توجيهك إلى لوحة المحامي' };
          } else {
            // User not found in either table
            await signOut();
            return { success: false, message: 'المستخدم غير موجود' };
          }
        }

        setUser(data.user);
        setUserProfile(userData);
        return { success: true, user: userData };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error) throw error;

      if (data.user) {
        // Insert user data into users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            email: userData.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone,
            city: userData.city,
            id_number: userData.idNumber,
            user_type: 'client',
            account_status: 'approved' // Auto-approve clients
          });

        if (insertError) throw insertError;

        return { success: true, message: 'تم إنشاء الحساب بنجاح' };
      }
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear localStorage
      localStorage.removeItem('user');
      
      // Clear Supabase session if exists
      const { error } = await supabase.auth.signOut();
      if (error) console.warn('Supabase signOut error:', error);
      
      setUser(null);
      setUserProfile(null);
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!userProfile) return { success: false, message: 'المستخدم غير مسجل الدخول' };

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', userProfile.user_id);

      if (error) throw error;

      // Update local state
      setUserProfile({ ...userProfile, ...updates });
      return { success: true, message: 'تم تحديث الملف الشخصي بنجاح' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: error.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!userProfile?.email) {
        return { success: false, message: 'المستخدم غير مسجل الدخول' };
      }

      // Verify current password by querying the database
      const { data: userData, error: verifyError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('email', userProfile.email)
        .eq('user_id', userProfile.user_id)
        .single();

      if (verifyError || !userData) {
        return { success: false, message: 'المستخدم غير موجود' };
      }

      // Verify current password (simple comparison for now)
      // In production, you should use bcrypt.compare()
      if (userData.password_hash !== currentPassword) {
        return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
      }

      // Update password in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newPassword })
        .eq('user_id', userProfile.user_id);

      if (updateError) {
        console.error('Update password error:', updateError);
        return { success: false, message: 'فشل تحديث كلمة المرور' };
      }

      return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: error.message || 'حدث خطأ في تغيير كلمة المرور' };
    }
  };

  const refreshAuth = () => {
    checkLocalStorageAuth();
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    changePassword,
    refreshAuth,
    isClient: userProfile?.user_type === 'client',
    isLawyer: userProfile?.user_type === 'lawyer'
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
};
