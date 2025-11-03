import React, { useState, useEffect } from 'react';
import { useClientAuth } from '../../hooks/useClientAuth';
import { supabase } from '../../supabaseClient';
import { Camera, User } from 'lucide-react';

const Profile = () => {
  const { userProfile, updateProfile } = useClientAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Personal Information Form
  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    id_number: ''
  });

  // Profile Image States
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setPersonalInfo({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        city: userProfile.city || '',
        id_number: userProfile.id_number || ''
      });
      
      // Set profile image if exists
      if (userProfile.profile_image_url) {
        setProfileImageUrl(userProfile.profile_image_url);
      }
    }
  }, [userProfile]);

  // Handle profile image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploadingImage(true);
    setError('');
    setMessage('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `user_${userProfile.user_id}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage with public access
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Update user profile with new image URL
      const result = await updateProfile({ profile_image_url: publicUrl });
      
      if (result.success) {
        setProfileImageUrl(publicUrl);
        setMessage('تم تحديث صورة الملف الشخصي بنجاح');
      } else {
        throw new Error(result.message || 'فشل تحديث الملف الشخصي');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(`حدث خطأ في رفع الصورة: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await updateProfile(personalInfo);
      setMessage('تم تحديث المعلومات الشخصية بنجاح');
    } catch (error) {
      setError('حدث خطأ في تحديث المعلومات');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };


  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header with gradient */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-6 sm:p-8 text-white shadow-lg">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="bg-white/20 p-3 rounded-lg">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">الملف الشخصي</h1>
              <p className="text-blue-100">إدارة معلوماتك الشخصية وصورة الملف</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
          {/* Messages */}
          {message && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm sm:text-base">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm sm:text-base">
              {error}
            </div>
          )}

          {/* Personal Information Form */}
          <form onSubmit={handlePersonalInfoSubmit} className="space-y-8">
            <div className="flex items-center space-x-3 space-x-reverse pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">المعلومات الشخصية</h3>
            </div>
              
              {/* Profile Image Section */}
              <div className="flex flex-col items-center space-y-4 p-6 sm:p-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800">
                <div className="relative group">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-cyan-400 dark:from-blue-600 dark:to-cyan-600 flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-xl">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="صورة الملف الشخصي"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-14 h-14 sm:w-16 sm:h-16 text-white" />
                    )}
                  </div>
                  
                  <label
                    htmlFor="profile-image-upload"
                    className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-2 sm:p-2.5 rounded-full cursor-pointer transition-all shadow-lg hover:shadow-xl transform hover:scale-110"
                  >
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </label>
                  
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </div>
                
                <div className="text-center">
                  <p className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-100 mb-2">
                    {uploadingImage ? '⏳ جاري رفع الصورة...' : '📸 اضغط على أيقونة الكاميرا لتغيير الصورة'}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                    JPG, PNG أو GIF • حد أقصى 5 ميجابايت
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2 space-x-reverse">
                    <span>الاسم الأول</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personalInfo.first_name}
                    onChange={(e) => setPersonalInfo({...personalInfo, first_name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    required
                    placeholder="أدخل الاسم الأول"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2 space-x-reverse">
                    <span>اسم العائلة</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personalInfo.last_name}
                    onChange={(e) => setPersonalInfo({...personalInfo, last_name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    required
                    placeholder="أدخل اسم العائلة"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2 space-x-reverse">
                    <span>البريد الإلكتروني</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    required
                    placeholder="example@email.com"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2 space-x-reverse">
                    <span>رقم الهاتف</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    required
                    placeholder="05XXXXXXXX"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2 space-x-reverse">
                    <span>المدينة</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personalInfo.city}
                    onChange={(e) => setPersonalInfo({...personalInfo, city: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    required
                    placeholder="أدخل المدينة"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2 space-x-reverse">
                    <span>رقم الهوية</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">(غير قابل للتعديل)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={personalInfo.id_number}
                      disabled
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2 space-x-reverse"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>حفظ التغييرات</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  export default Profile;
