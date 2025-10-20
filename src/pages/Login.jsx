import React, { useState } from 'react';
import { Scale, CreditCard, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { validatePalestinianID } from '../utils/idValidation';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [idError, setIdError] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [formData, setFormData] = useState({
    idNumber: '',
    password: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear errors when user starts typing
    if (name === 'idNumber') {
      setIdError('');
    }
    setLoginError('');
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleIdBlur = () => {
    if (formData.idNumber.trim()) {
      const validation = validatePalestinianID(formData.idNumber);
      if (!validation.isValid) {
        setIdError(validation.error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate ID number
    const idValidation = validatePalestinianID(formData.idNumber);
    if (!idValidation.isValid) {
      setIdError(idValidation.error);
      return;
    }
    
    try {
      const cleanIdNumber = formData.idNumber.replace(/[\s-]/g, '');
      
      // First, try to login as admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id_number', cleanIdNumber)
        .eq('password_hash', formData.password)
        .single();

      if (adminData && !adminError) {
        // Admin login successful
        localStorage.setItem('user', JSON.stringify(adminData));
        alert('تم تسجيل الدخول كمسؤول بنجاح!');
        navigate('/');
        return;
      }

      // Try to find user in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id_number', cleanIdNumber)
        .eq('password_hash', formData.password)
        .single();

      console.log('Client login attempt:', { userData, userError, cleanIdNumber });

      if (userData && !userError) {
        // Check account status for regular users
        if (userData.account_status === 'pending') {
          setLoginError('حسابك قيد المراجعة. يرجى الانتظار حتى يتم الموافقة عليه.');
          return;
        }

        if (userData.account_status === 'rejected') {
          setLoginError('تم رفض حسابك. السبب: ' + (userData.rejection_reason || 'غير محدد'));
          return;
        }

        
        // Check if it's a client
if (userData.user_type === 'client') {
  console.log('Client login successful!');
  localStorage.setItem('user', JSON.stringify(userData));
  alert('تم تسجيل الدخول كعميل بنجاح!');
  // Force refresh the page to trigger auth check
  window.location.href = '/client/dashboard';
  return;
}

// Other user types
localStorage.setItem('user', JSON.stringify(userData));
alert('تم تسجيل الدخول بنجاح!');
navigate('/');
return;
}

// Try lawyer login
const { data: lawyerData, error: lawyerError } = await supabase
  .from('lawyers')
  .select('*')
  .eq('id_number', cleanIdNumber)
  .eq('password_hash', formData.password)
  .single();

console.log('Lawyer login attempt:', { lawyerData, lawyerError });

if (lawyerData && !lawyerError) {
  // Check lawyer account status
  if (lawyerData.account_status === 'pending') {
    setLoginError('حسابك قيد المراجعة. يرجى الانتظار حتى يتم الموافقة عليه.');
    return;
  }

  if (lawyerData.account_status === 'rejected') {
    setLoginError('تم رفض حسابك. السبب: ' + (lawyerData.rejection_reason || 'غير محدد'));
    return;
  }

  // Save lawyer data and redirect to lawyer dashboard
  localStorage.setItem('user', JSON.stringify({ ...lawyerData, user_type: 'lawyer' }));
  alert('تم تسجيل الدخول كمحامي بنجاح!');
  navigate('/lawyer/dashboard');
  return;
}

// If nothing worked
setLoginError('رقم الهوية أو كلمة السر غير صحيحة');

        
      
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-12 transition-colors duration-300 pt-20">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 space-x-reverse mb-6 hover:opacity-80 transition">
            <Scale className="h-10 w-10 text-blue-600 dark:text-white" />
            <span className="text-3xl font-bold gradient-text">المنصة القانونية</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">تسجيل الدخول</h1>
          <p className="text-gray-600 dark:text-gray-300">مرحباً بعودتك! سجل دخولك للمتابعة</p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Login Error */}
            {loginError && (
              <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 rounded-xl p-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-red-800 dark:text-red-300 font-semibold">{loginError}</p>
                </div>
              </div>
            )}

            {/* ID Number */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                رقم الهوية
              </label>
              <div className="relative">
                <CreditCard className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  onBlur={handleIdBlur}
                  className={`w-full px-4 py-3 pr-12 border ${
                    idError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition`}
                  placeholder="أدخل رقم الهوية (9 أرقام)"
                  maxLength="11"
                  required
                />
              </div>
              {idError && (
                <div className="flex items-center space-x-2 space-x-reverse mt-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{idError}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                كلمة السر
              </label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 pl-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">تذكرني</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:underline font-semibold">
                نسيت كلمة السر؟
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition transform hover:scale-105 flex items-center justify-center space-x-2 space-x-reverse"
            >
              <span>تسجيل الدخول</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              ليس لديك حساب؟{' '}
              <Link to="/signup" className="text-blue-600 hover:underline font-semibold">
                إنشاء حساب جديد
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            بتسجيل الدخول، أنت توافق على{' '}
            <a href="#" className="text-blue-600 hover:underline">
              الشروط والأحكام
            </a>{' '}
            و{' '}
            <a href="#" className="text-blue-600 hover:underline">
              سياسة الخصوصية
            </a>
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;
