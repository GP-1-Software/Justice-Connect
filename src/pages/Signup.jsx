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
    
    // Clear ID error when user starts typing
    if (name === 'idNumber') {
      setIdError('');
    }
    
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
      alert('كلمات السر غير متطابقة');
      return;
    }
    
    try {
      // Insert user data into Supabase
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
            password_hash: formData.password, // TODO: Hash password before storing
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
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
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
                    placeholder="+970 XX XXX XXXX"
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
                      required={userType === 'lawyer' && !certificateFile}
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
                    className="w-full px-4 py-3 pr-12 pl-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
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
                    className="w-full px-4 py-3 pr-12 pl-12 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
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
                <a href="#" className="text-blue-600 hover:underline font-semibold">
                  الشروط والأحكام
                </a>{' '}
                و{' '}
                <a href="#" className="text-blue-600 hover:underline font-semibold">
                  سياسة الخصوصية
                </a>
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
    </div>
  );
};

export default Signup;
