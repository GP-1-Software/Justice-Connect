import React, { useState } from 'react';
import { Scale, User, Briefcase, Mail, Phone, MapPin, Lock, Upload, ArrowRight, Eye, EyeOff, CreditCard, X, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { validatePalestinianID, formatPalestinianID } from '../utils/idValidation';
import { supabase } from '../supabaseClient';

const Signup = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('client'); // 'client' or 'lawyer'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [idError, setIdError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: '',
    idNumber: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    const updatedFormData = {
      ...formData,
      [name]: value
    };
    
    // Clear ID error when user starts typing
    if (name === 'idNumber') {
      setIdError('');
      // Check password security if password exists
      if (updatedFormData.password) {
        const passwordValidation = validatePasswordSecurity(updatedFormData.password, value);
        setPasswordError(passwordValidation.isValid ? '' : passwordValidation.error);
      }
    }
    
    // Clear password error when user starts typing password
    if (name === 'password' || name === 'confirmPassword') {
      // Check password security in real-time if ID number exists
      if (name === 'password' && updatedFormData.idNumber) {
        const passwordValidation = validatePasswordSecurity(value, updatedFormData.idNumber);
        setPasswordError(passwordValidation.isValid ? '' : passwordValidation.error);
      } else if (name === 'password') {
        setPasswordError('');
      }
      
      // Check password match in real-time
      if (name === 'password') {
        // When typing password, check against confirmPassword
        if (updatedFormData.confirmPassword && value !== updatedFormData.confirmPassword) {
          setConfirmPasswordError('كلمات المرور غير متطابقة');
        } else {
          setConfirmPasswordError('');
        }
      } else if (name === 'confirmPassword') {
        // When typing confirmPassword, check against password
        if (updatedFormData.password && value !== updatedFormData.password) {
          setConfirmPasswordError('كلمات المرور غير متطابقة');
        } else {
          setConfirmPasswordError('');
        }
      }
    }
    
    setFormData(updatedFormData);
  };

  const handleIdBlur = () => {
    if (formData.idNumber.trim()) {
      const validation = validatePalestinianID(formData.idNumber);
      if (!validation.isValid) {
        setIdError(validation.error);
      } else {
        setIdError('');
        // Auto-format the ID
        setFormData({
          ...formData,
          idNumber: formatPalestinianID(formData.idNumber)
        });
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setCertificateFile(file);
    } else {
      alert('يرجى رفع ملف PDF فقط');
    }
  };

  const handleRemoveFile = () => {
    setCertificateFile(null);
    // Reset the file input
    const fileInput = document.getElementById('certificate-upload');
    if (fileInput) fileInput.value = '';
  };

  // Function to check if password is similar to ID number
  const validatePasswordSecurity = (password, idNumber) => {
    if (!password || !idNumber) return { isValid: true, error: '' };
    
    const cleanId = idNumber.replace(/[\s-]/g, ''); // Remove spaces and dashes
    const cleanPassword = password.toLowerCase();
    
    // Check if password contains the full ID number
    if (cleanPassword.includes(cleanId)) {
      return {
        isValid: false,
        error: 'كلمة المرور لا يجب أن تحتوي على رقم الهوية'
      };
    }
    
    // Check if password is exactly the ID number
    if (cleanPassword === cleanId) {
      return {
        isValid: false,
        error: 'كلمة المرور لا يجب أن تكون مطابقة لرقم الهوية'
      };
    }
    
    // Check if password contains significant portions of ID (4+ consecutive digits)
    for (let i = 0; i <= cleanId.length - 4; i++) {
      const idPortion = cleanId.substring(i, i + 4);
      if (cleanPassword.includes(idPortion)) {
        return {
          isValid: false,
          error: 'كلمة المرور لا يجب أن تحتوي على أجزاء من رقم الهوية'
        };
      }
    }
    
    return { isValid: true, error: '' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate ID number before submission
    const idValidation = validatePalestinianID(formData.idNumber);
    if (!idValidation.isValid) {
      setIdError(idValidation.error);
      return;
    }
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError('كلمات المرور غير متطابقة');
      alert('كلمات المرور غير متطابقة');
      return;
    }
    
    // Validate password security (not similar to ID number)
    const passwordValidation = validatePasswordSecurity(formData.password, formData.idNumber);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error);
      alert(passwordValidation.error);
      return;
    }
    
    try {
      // Certificate is optional during testing; no enforcement here
      if (userType === 'lawyer') {
        // Optional: upload certificate to Supabase Storage (bucket: lawyer-certificates)
        let certificateUrl = null;
        if (certificateFile) {
          const cleanId = formData.idNumber.replace(/[\s-]/g, '');
          const objectPath = `lawyers/${cleanId}-${Date.now()}.pdf`;
          const { error: uploadError } = await supabase.storage
            .from('lawyer-certificates') // Ensure this bucket exists in Supabase Storage
            .upload(objectPath, certificateFile, {
              cacheControl: '3600',
              upsert: false,
              contentType: 'application/pdf'
            });

          if (uploadError) {
            console.warn('Certificate upload skipped due to error (continuing without it):', uploadError);
          } else {
            const { data: publicData } = supabase.storage
              .from('lawyer-certificates')
              .getPublicUrl(objectPath);
            certificateUrl = publicData?.publicUrl || null;
          }
        }

        // Insert lawyer into lawyers table
        const { data, error } = await supabase
          .from('lawyers')
          .insert([
            {
              user_type: 'lawyer',
              first_name: formData.firstName,
              last_name: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              city: formData.city,
              id_number: formData.idNumber.replace(/[\s-]/g, ''),
              password_hash: formData.password,
              certificate_url: certificateUrl,
              account_status: 'pending'
            }
          ])
          .select();

        if (error) {
          console.error('Supabase error (lawyers):', error);
          alert('حدث خطأ أثناء إنشاء حساب المحامي: ' + error.message);
          return;
        }

        console.log('Lawyer created successfully:', data);
        alert('تم إنشاء الحساب بنجاح!\nسيتم مراجعة حسابك قريباً.');
        navigate('/login');
        return;
      }

      // Default flow (e.g., client)
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            user_type: userType,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            city: formData.city,
            id_number: formData.idNumber.replace(/[\s-]/g, ''),
            password_hash: formData.password,
            account_status: 'pending'
          }
        ])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        alert('حدث خطأ أثناء إنشاء الحساب: ' + error.message);
        return;
      }

      console.log('User created successfully:', data);
      alert('تم إنشاء الحساب بنجاح!\nسيتم مراجعة حسابك قريباً.');
      navigate('/login');
      
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 space-x-reverse mb-6 hover:opacity-80 transition">
            <Scale className="h-10 w-10 text-blue-600 dark:text-white" />
            <span className="text-3xl font-bold gradient-text">المنصة القانونية</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">إنشاء حساب جديد</h1>
          <p className="text-gray-600 dark:text-gray-300">انضم إلينا وابدأ رحلتك القانونية</p>
        </div>

        {/* User Type Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-2 mb-8 max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setUserType('client')}
              className={`flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition ${
                userType === 'client'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <User className="h-5 w-5" />
              <span>عميل</span>
            </button>
            <button
              onClick={() => setUserType('lawyer')}
              className={`flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition ${
                userType === 'lawyer'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Briefcase className="h-5 w-5" />
              <span>محامي</span>
            </button>
          </div>
        </div>

        {/* Signup Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">الاسم الأول</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="أدخل الاسم الأول"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">الاسم الأخير</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="أدخل الاسم الأخير"
                  required
                />
              </div>
            </div>
            {/* Email */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="example@gmail.com"
                  required
                  pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                />
              </div>
            </div>

            {/* Phone and City */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="+97X XX XXX XXXX"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">المدينة</label>
                <div className="relative">
                  <MapPin className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="طولكرم، نابلس، جنين..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* ID Number for Clients */}
            {userType === 'client' && (
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">رقم الهوية</label>
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
            )}

            {/* Lawyer-specific fields */}
            {userType === 'lawyer' && (
              <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                  <p className="text-blue-800 dark:text-blue-300 font-semibold text-sm">
                    <Briefcase className="inline h-4 w-4 ml-2" />
                    معلومات إضافية للمحامين (مطلوبة للتحقق من الهوية)
                  </p>
                </div>

                {/* ID Number */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">رقم الهوية</label>
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
                      required={userType === 'lawyer'}
                    />
                  </div>
                  {idError && (
                    <div className="flex items-center space-x-2 space-x-reverse mt-2 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{idError}</span>
                    </div>
                  )}
                </div>

                {/* Certificate Upload */}
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">شهادة المحاماة (PDF)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="certificate-upload"
                    />
                    {certificateFile ? (
                      <div className="flex items-center justify-between w-full px-4 py-4 border-2 border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/30 rounded-xl">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Upload className="h-6 w-6 text-green-600 dark:text-green-400" />
                          <p className="text-green-700 dark:text-green-300 font-semibold">{certificateFile.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition group"
                          title="إزالة الملف"
                        >
                          <X className="h-5 w-5 text-red-500 group-hover:text-red-700 dark:group-hover:text-red-400" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="certificate-upload"
                        className="flex items-center justify-center space-x-3 space-x-reverse w-full px-4 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition cursor-pointer"
                      >
                        <Upload className="h-6 w-6 text-gray-400" />
                        <div className="text-center">
                          <p className="text-gray-700 dark:text-gray-300 font-semibold">اضغط لرفع الشهادة</p>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">PDF فقط، حجم أقصى 5MB</p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Password Fields */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">كلمة السر</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 pl-12 border ${
                      passwordError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordError && (
                  <div className="flex items-center space-x-2 space-x-reverse mt-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{passwordError}</span>
                  </div>
                )}
               
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">تأكيد كلمة السر</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 pl-12 border ${
                      confirmPasswordError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {confirmPasswordError && (
                  <div className="flex items-center space-x-2 space-x-reverse mt-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{confirmPasswordError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3 space-x-reverse">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="text-gray-600 dark:text-gray-300 text-sm">
                أوافق على{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-blue-600 hover:underline font-semibold hover:text-blue-800 dark:hover:text-blue-400"
                >
                  الشروط والأحكام
                </button>{' '}
                و{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-blue-600 hover:underline font-semibold hover:text-blue-800 dark:hover:text-blue-400"
                >
                  سياسة الخصوصية
                </button>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition transform hover:scale-105 flex items-center justify-center space-x-2 space-x-reverse"
            >
              <span>إنشاء الحساب</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">الشروط والأحكام</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              >
                <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] text-gray-700 dark:text-gray-300 space-y-4">
              <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">مرحباً بك في المنصة القانونية</h3>
              
              <h4 className="text-lg font-semibold mt-6">1. قبول الشروط</h4>
              <p>بموجب استخدامك لهذه المنصة، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا لم تتفق مع أي من هذه الشروط، يرجى عدم استخدام المنصة.</p>
              
              <h4 className="text-lg font-semibold mt-6">2. وصف الخدمة</h4>
              <p>المنصة القانونية هي منصة رقمية تربط بين العملاء والمحامين المرخصين لتقديم الاستشارات القانونية والخدمات المتعلقة بها. تشمل خدماتنا:</p>
              <ul className="list-disc list-inside mr-6 space-y-2">
                <li>حجز المواعيد مع المحامين المعتمدين</li>
                <li>الاستشارات القانونية عبر الفيديو أو الهاتف</li>
                <li>إدارة القضايا والمتابعة</li>
                <li>تبادل الوثائق والملفات بشكل آمن</li>
                <li>تقديم التقارير والتحليلات القانونية</li>
              </ul>
              
              <h4 className="text-lg font-semibold mt-6">3. التسجيل والحسابات</h4>
              <p>لاستخدام المنصة، يجب عليك:</p>
              <ul className="list-disc list-inside mr-6 space-y-2">
                <li>تقديم معلومات صحيحة ومحدثة عند التسجيل</li>
                <li>الحفاظ على سرية كلمة المرور الخاصة بك</li>
                <li>إشعارنا فوراً بأي استخدام غير مصرح به لحسابك</li>
                <li>التأكد من صحة رقم الهوية المُدخل</li>
              </ul>
              
              <h4 className="text-lg font-semibold mt-6">4. التزامات المحامين</h4>
              <p>المحامون المسجلون في المنصة يلتزمون بـ:</p>
              <ul className="list-disc list-inside mr-6 space-y-2">
                <li>تقديم شهادة محاماة صالحة ومعتمدة</li>
                <li>الالتزام بأخلاقيات المهنة القانونية</li>
                <li>تقديم خدمات قانونية عالية الجودة</li>
                <li>الحفاظ على سرية معلومات العملاء</li>
                <li>الرد على استفسارات العملاء في الوقت المناسب</li>
              </ul>
              
              <h4 className="text-lg font-semibold mt-6">5. المدفوعات والرسوم</h4>
              <ul className="list-disc list-inside mr-6 space-y-2">
                <li>الأسعار محددة من قبل كل محامٍ بشكل مستقل</li>
                <li>المدفوعات تتم عبر وسائل دفع آمنة ومعتمدة</li>
                <li>لا توجد رسوم خفية - جميع التكاليف واضحة مسبقاً</li>
                <li>سياسة الاسترداد تطبق وفقاً للحالات المحددة</li>
              </ul>
              
              <h4 className="text-lg font-semibold mt-6">6. إنهاء الحساب</h4>
              <p>يحق لنا إنهاء أو تعليق حسابك في حالة مخالفة هذه الشروط أو سوء الاستخدام.</p>
              
              <h4 className="text-lg font-semibold mt-6">7. إخلاء المسؤولية</h4>
              <p>المنصة تعمل كوسيط بين العملاء والمحامين. نحن لسنا مسؤولين عن جودة الخدمات المقدمة من المحامين أو نتائج القضايا.</p>
              
              <h4 className="text-lg font-semibold mt-6">8. القانون الحاكم</h4>
              <p>تخضع هذه الشروط للقوانين المعمول بها في دولة فلسطين.</p>
              
              <p className="mt-6 text-sm text-gray-500">آخر تحديث: نوفمبر 2025</p>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                موافق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">سياسة الخصوصية</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              >
                <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] text-gray-700 dark:text-gray-300 space-y-4">
              <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">حماية خصوصيتك أولويتنا</h3>
              
              <h4 className="text-lg font-semibold mt-6">1. المعلومات التي نجمعها</h4>
              <p>نحن نجمع المعلومات التالية لتقديم خدماتنا:</p>
              <ul className="list-disc list-inside mr-6 space-y-2">
                <li><strong>المعلومات الشخصية:</strong> الاسم، رقم الهوية، البريد الإلكتروني، رقم الهاتف</li>
                <li><strong>معلومات الاتصال:</strong> العنوان، المدينة</li>
                <li><strong>المعلومات المهنية:</strong> للمحامين (شهادة المحاماة، التخصص، سنوات الخبرة)</li>
                <li><strong>معلومات الاستخدام:</strong> سجلات الدخول، الأنشطة على المنصة</li>
                <li><strong>المحادثات والملفات:</strong> الاستشارات، الوثائق المرفقة</li>
              </ul>
              
              <h4 className="text-lg font-semibold mt-6">2. كيف نستخدم معلوماتك</h4>
              <ul className="list-disc list-inside mr-6 space-y-2">
                <li>تقديم وتحسين خدماتنا القانونية</li>
                <li>التحقق من هوية المستخدمين والمحامين</li>
                <li>تسهيل التواصل بين العملاء والمحامين</li>
                <li>معالجة المدفوعات والفواتير</li>
                <li>إرسال إشعارات مهمة حول حسابك</li>
                <li>تحسين أمان المنصة ومنع الاحتيال</li>
                <li>الامتثال للمتطلبات القانونية</li>
              </ul>
              
              <h4 className="text-lg font-semibold mt-6">3. مشاركة المعلومات</h4>
              <p>نحن لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك فقط في الحالات التالية:</p>
              <ul className="list-disc list-inside mr-6 space-y-2">
                <li>مع المحامين المعتمدين لتقديم الخدمات المطلوبة</li>
                <li>مع مقدمي الخدمات التقنية الموثوقين</li>
                <li>عند وجود أمر قانوني أو قضائي</li>
                <li>لحماية حقوقنا أو حقوق المستخدمين الآخرين</li>
              </ul>
              
              <h4 className="text-lg font-semibold mt-6">4. أمان المعلومات</h4>
              <p>نطبق تدابير أمنية متقدمة لحماية معلوماتك:</p>
              <ul className="list-disc list-inside mr-6 space-y-2">
                <li>تشفير البيانات أثناء النقل والتخزين</li>
                <li>مراقبة الوصول وصلاحيات المستخدمين</li>
                <li>النسخ الاحتياطي المنتظم للبيانات</li>
                <li>تحديثات الأمان المستمرة</li>
                <li>اختبارات الأمان الدورية</li>
              </ul>
              
              <h4 className="text-lg font-semibold mt-6">5. ملفات تعريف الارتباط (Cookies)</h4>
              <p>نستخدم ملفات تعريف الارتباط لـ:</p>
              <ul className="list-disc list-inside mr-6 space-y-2">
                <li>تحسين تجربة التصفح</li>
                <li>تذكر تفضيلاتك</li>
                <li>تحليل استخدام المنصة</li>
                <li>توفير ميزات الأمان</li>
              </ul>
              
              <h4 className="text-lg font-semibold mt-6">6. حقوقك</h4>
              <p>لديك الحق في:</p>
              <ul className="list-disc list-inside mr-6 space-y-2">
                <li>الوصول إلى معلوماتك الشخصية</li>
                <li>تصحيح أو تحديث معلوماتك</li>
                <li>حذف حسابك ومعلوماتك</li>
                <li>تقييد معالجة معلوماتك</li>
                <li>الاعتراض على معالجة معيّنة</li>
                <li>نقل بياناتك (عند الإمكان)</li>
              </ul>
              
              <h4 className="text-lg font-semibold mt-6">7. الاحتفاظ بالبيانات</h4>
              <p>نحتفظ بمعلوماتك طالما كان حسابك نشطاً أو حسب الحاجة لتقديم الخدمات. قد نحتفظ ببعض المعلومات لفترة أطول للامتثال القانوني.</p>
              
              <h4 className="text-lg font-semibold mt-6">8. خصوصية الأطفال</h4>
              <p>خدماتنا مخصصة للبالغين (18+ عام). نحن لا نجمع معلومات من الأطفال دون سن 18 عاماً بشكل مقصود.</p>
              
              <h4 className="text-lg font-semibold mt-6">9. تحديثات السياسة</h4>
              <p>قد نحدث هذه السياسة من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة.</p>
              
              <h4 className="text-lg font-semibold mt-6">10. التواصل معنا</h4>
              <p>لأي استفسارات حول خصوصيتك أو هذه السياسة:</p>
              <ul className="list-disc list-inside mr-6 space-y-2">
                <li>البريد الإلكتروني: ali.odeh.pss@gmail.com</li>
                <li>الهاتف: 0592891676</li>
                <li>العنوان: فلسطين</li>
              </ul>
              
              <p className="mt-6 text-sm text-gray-500">آخر تحديث: نوفمبر 2025</p>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                موافق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
