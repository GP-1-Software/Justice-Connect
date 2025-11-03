import React, { useState, useEffect } from 'react';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';
import { Save, Loader2, Camera, User } from 'lucide-react';

const ProfileForm = () => {
  const { lawyer, refreshLawyer } = useLawyerAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    city: '',
    specialization: [],
    bio: '',
    years_of_experience: '',
    license_number: ''
  });

  useEffect(() => {
    if (lawyer) {
      setFormData({
        first_name: lawyer.first_name || '',
        last_name: lawyer.last_name || '',
        phone: lawyer.phone || '',
        email: lawyer.email || '',
        city: lawyer.city || '',
        specialization: Array.isArray(lawyer.specialization) ? lawyer.specialization : (lawyer.specialization ? [lawyer.specialization] : []),
        bio: lawyer.bio || '',
        years_of_experience: lawyer.years_of_experience || '',
        license_number: lawyer.license_number || ''
      });
      
      // Set profile image if exists
      if (lawyer.profile_image_url) {
        setProfileImageUrl(lawyer.profile_image_url);
      }
    }
  }, [lawyer]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle profile image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `lawyer_${lawyer.lawyer_id}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update lawyer profile with new image URL
      const { error: updateError } = await supabase
        .from('lawyers')
        .update({ profile_image_url: publicUrl })
        .eq('lawyer_id', lawyer.lawyer_id);
      
      if (updateError) throw updateError;
      
      setProfileImageUrl(publicUrl);
      if (refreshLawyer) {
        await refreshLawyer();
      }
      alert('تم تحديث صورة الملف الشخصي بنجاح');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`حدث خطأ في رفع الصورة: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lawyer) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('lawyers')
        .update(formData)
        .eq('lawyer_id', lawyer.lawyer_id);

      if (error) throw error;
      
      // Reload lawyer data to show updated values
      if (refreshLawyer) {
        await refreshLawyer();
      }
      
      alert('تم حفظ التغييرات بنجاح');
    } catch (error) {
      console.error('Profile update error:', error.message);
      alert('حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Profile Image Section */}
      <div className="flex flex-col items-center space-y-4 p-6 sm:p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-dashed border-green-200 dark:border-green-800">
        <div className="relative group">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-emerald-400 dark:from-green-600 dark:to-emerald-600 flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-xl">
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
            htmlFor="lawyer-profile-image-upload"
            className="absolute bottom-0 right-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-2 sm:p-2.5 rounded-full cursor-pointer transition-all shadow-lg hover:shadow-xl transform hover:scale-110"
          >
            {uploadingImage ? (
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </label>
          
          <input
            id="lawyer-profile-image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={uploadingImage}
          />
        </div>
        
        <div className="text-center">
          <p className="text-sm sm:text-base font-medium text-green-900 dark:text-green-100 mb-2">
            {uploadingImage ? '⏳ جاري رفع الصورة...' : '📸 اضغط على أيقونة الكاميرا لتغيير الصورة'}
          </p>
          <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">
            JPG, PNG أو GIF • حد أقصى 5 ميجابايت
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            الاسم الأول
          </label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            الاسم الأخير
          </label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
            disabled
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            رقم الهاتف
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            المدينة
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Specialization */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            التخصص (يمكن اختيار أكثر من تخصص)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'قانون تجاري',
              'قانون جنائي',
              'قانون مدني',
              'قانون الأسرة',
              'قانون العمل',
              'قانون العقارات'
            ].map((spec) => (
              <label
                key={spec}
                className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.specialization.includes(spec)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.specialization.includes(spec)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        specialization: [...formData.specialization, spec]
                      });
                    } else {
                      setFormData({
                        ...formData,
                        specialization: formData.specialization.filter(s => s !== spec)
                      });
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">{spec}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Years of Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            سنوات الخبرة
          </label>
          <input
            type="number"
            name="years_of_experience"
            value={formData.years_of_experience}
            onChange={handleChange}
            min="0"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* License Number */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            رقم ترخيص المحامي
          </label>
          <input
            type="text"
            name="license_number"
            value={formData.license_number}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Bio */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            السيرة الذاتية
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            placeholder="اكتب نبذة عن خبراتك ومؤهلاتك..."
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              حفظ التغييرات
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
