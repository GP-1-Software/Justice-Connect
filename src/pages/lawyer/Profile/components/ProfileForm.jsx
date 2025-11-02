import React, { useState, useEffect } from 'react';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';
import { Save, Loader2 } from 'lucide-react';

const ProfileForm = () => {
  const { lawyer, refreshLawyer } = useLawyerAuth();
  const [loading, setLoading] = useState(false);
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
    }
  }, [lawyer]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
    <form onSubmit={handleSubmit} className="space-y-6">
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
