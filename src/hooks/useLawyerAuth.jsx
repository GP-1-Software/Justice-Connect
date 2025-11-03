import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

// Create Auth Context
const LawyerAuthContext = createContext();

// Custom hook to use auth context
export const useLawyerAuth = () => {
  const context = useContext(LawyerAuthContext);
  if (!context) {
    throw new Error('useLawyerAuth must be used within a LawyerAuthProvider');
  }
  return context;
};

// Auth Provider Component
export const LawyerAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lawyer, setLawyer] = useState(null);
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
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        
        if (userData.user_type === 'lawyer') {
          setLawyer(userData);
          setUser({ id: userData.lawyer_id, email: userData.email });
        }
      }
    } catch (error) {
      console.error('Error checking localStorage auth:', error);
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
      setLawyer(null);
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!lawyer) return { success: false, message: 'المستخدم غير مسجل الدخول' };

      const { error } = await supabase
        .from('lawyers')
        .update(updates)
        .eq('lawyer_id', lawyer.lawyer_id);

      if (error) throw error;

      // Update local state
      setLawyer({ ...lawyer, ...updates });
      
      // Update localStorage
      const updatedLawyer = { ...lawyer, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedLawyer));
      
      return { success: true, message: 'تم تحديث الملف الشخصي بنجاح' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: error.message };
    }
  };

  const refreshAuth = () => {
    checkLocalStorageAuth();
  };

  const refreshLawyer = async () => {
    try {
      if (!lawyer?.lawyer_id) return;
      
      const { data, error } = await supabase
        .from('lawyers')
        .select('*')
        .eq('lawyer_id', lawyer.lawyer_id)
        .single();

      if (error) throw error;

      if (data) {
        setLawyer(data);
        localStorage.setItem('user', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error refreshing lawyer data:', error);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!lawyer) return { success: false, message: 'المستخدم غير مسجل الدخول' };

      // Verify current password by querying the database
      const { data: lawyerData, error: verifyError } = await supabase
        .from('lawyers')
        .select('password_hash')
        .eq('email', lawyer.email)
        .eq('lawyer_id', lawyer.lawyer_id)
        .single();

      if (verifyError) throw verifyError;

      // Check if current password matches
      if (lawyerData.password_hash !== currentPassword) {
        return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
      }

      // Update password in database
      const { error: updateError } = await supabase
        .from('lawyers')
        .update({ password_hash: newPassword })
        .eq('lawyer_id', lawyer.lawyer_id);

      if (updateError) throw updateError;

      return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'حدث خطأ أثناء تغيير كلمة المرور' };
    }
  };

  const value = {
    user,
    lawyer,
    loading,
    signOut,
    updateProfile,
    refreshAuth,
    refreshLawyer,
    changePassword,
    isLawyer: lawyer?.user_type === 'lawyer'
  };

  return (
    <LawyerAuthContext.Provider value={value}>
      {children}
    </LawyerAuthContext.Provider>
  );
};
