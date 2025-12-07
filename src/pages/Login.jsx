import React, { useState } from 'react';
import { Scale, CreditCard, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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

  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [tempUserData, setTempUserData] = useState(null);

  const handleLoginSuccess = (user, role) => {
    // For admin/super_admin, set 'role' property; for others, set 'user_type'
    const userData = role === 'admin' || role === 'super_admin'
      ? { ...user, role: role, user_type: role }
      : { ...user, user_type: role };

    localStorage.setItem('user', JSON.stringify(userData));

    if (role === 'client') {
      sessionStorage.setItem(
        'clientLoginToast',
        JSON.stringify({ type: 'success', message: 'تم تسجيل الدخول كعميل بنجاح!' })
      );
      window.location.href = '/client/dashboard';
    } else if (role === 'lawyer') {
      toast.success('تم تسجيل الدخول كمحامي بنجاح!');
      navigate('/lawyer/dashboard');
    } else if (role === 'admin' || role === 'super_admin') {
      toast.success('تم تسجيل الدخول كمسؤول بنجاح!');
      navigate('/admin/dashboard');
    } else if (role === 'court_clerk') {
      toast.success('تم تسجيل الدخول كموظف قلم محكمة بنجاح!');
      navigate('/court-clerk/dashboard');
    } else {
      toast.success('تم تسجيل الدخول بنجاح!');
      navigate('/');
    }
  };

  const handleRoleSelect = (role) => {
    if (tempUserData) {
      handleLoginSuccess(tempUserData, role);
    }
  };

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

      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_number: cleanIdNumber,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || 'فشل تسجيل الدخول');
        return;
      }

      if (data.roles && data.roles.length > 1) {
        setAvailableRoles(data.roles);
        setTempUserData(data.user);
        setShowRoleSelection(true);
      } else if (data.roles && data.roles.length === 1) {
        handleLoginSuccess(data.user, data.roles[0]);
      } else {
        setLoginError('لم يتم العثور على أدوار لهذا المستخدم');
      }

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
                    className={`w-full px-4 py-3 pr-12 border ${idError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
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

      {/* Role Selection Modal */}
      {
        showRoleSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">اختر نوع الحساب</h2>
                <p className="text-gray-600 dark:text-gray-300">لديك أكثر من دور، يرجى اختيار الحساب الذي تريد الدخول إليه</p>
              </div>

              <div className="space-y-3">
                {availableRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`p-2 rounded-full ${role === 'client' ? 'bg-green-100 text-green-600' :
                        role === 'lawyer' ? 'bg-blue-100 text-blue-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                        {role === 'client' && <CreditCard className="h-6 w-6" />}
                        {role === 'lawyer' && <Scale className="h-6 w-6" />}
                        {(role === 'admin' || role === 'super_admin') && <Lock className="h-6 w-6" />}
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                          {role === 'client' ? 'حساب عميل' :
                            role === 'lawyer' ? 'حساب محامي' :
                              role === 'admin' ? 'مسؤول' : 'مسؤول عام'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {role === 'client' ? 'تصفح الخدمات وتابع قضاياك' :
                            role === 'lawyer' ? 'أدر قضاياك وتواصل مع العملاء' :
                              'إدارة النظام والمستخدمين'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transform group-hover:-translate-x-1 transition-all" />
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowRoleSelection(false)}
                className="mt-6 w-full py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-semibold transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        )
      }
    </>
  );
};

export default Login;
