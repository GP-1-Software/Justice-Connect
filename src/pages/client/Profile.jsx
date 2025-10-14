import React, { useState, useEffect } from 'react';
import { useClientAuth } from '../../hooks/useClientAuth';
import { supabase } from '../../supabaseClient';
import { Camera, Upload, User, AlertCircle } from 'lucide-react';
import { createDeletionRequest, getUserDeletionRequest } from '../../services/deletionRequestApi';

const Profile = () => {
  const { userProfile, updateProfile, changePassword } = useClientAuth();
  const [activeTab, setActiveTab] = useState('personal');
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

  // Account Deletion States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletionRequestStatus, setDeletionRequestStatus] = useState(null);

  // Password Change Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    caseUpdates: true,
    marketingEmails: false
  });

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

      // Check for existing deletion request
      checkDeletionRequestStatus();
    }
  }, [userProfile]);

  const checkDeletionRequestStatus = async () => {
    if (!userProfile?.user_id) return;
    
    const result = await getUserDeletionRequest(userProfile.user_id);
    if (result.success && result.data) {
      setDeletionRequestStatus(result.data);
    }
  };

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('كلمة المرور الجديدة غير متطابقة');
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setLoading(false);
      return;
    }

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setMessage('تم تغيير كلمة المرور بنجاح');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setError('حدث خطأ في تغيير كلمة المرور');
      console.error('Error changing password:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (setting, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));

    // Here you would typically save to database
    // For now, we'll just update local state
    setMessage('تم حفظ إعدادات الإشعارات');
  };

  const handleDeleteAccount = async () => {
    if (!deleteReason.trim()) {
      setError('يرجى كتابة سبب طلب الحذف');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await createDeletionRequest(
        userProfile.user_id,
        userProfile.user_type,
        deleteReason
      );

      if (result.success) {
        setMessage('تم إرسال طلب حذف الحساب بنجاح. سيتم مراجعته من قبل الإدارة.');
        setShowDeleteModal(false);
        setDeleteReason('');
        // Refresh deletion request status
        await checkDeletionRequestStatus();
      } else {
        setError('حدث خطأ في إرسال طلب الحذف');
      }
    } catch (error) {
      setError('حدث خطأ في إرسال طلب الحذف');
      console.error('Error creating deletion request:', error);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">الملف الشخصي</h1>
          <p className="text-gray-600 dark:text-gray-400">إدارة معلوماتك الشخصية وإعدادات الحساب</p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'personal', name: 'المعلومات الشخصية', icon: '👤' },
                { id: 'security', name: 'الأمان', icon: '🔒' },
                { id: 'notifications', name: 'الإشعارات', icon: '🔔' },
                { id: 'account', name: 'إدارة الحساب', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          {/* Messages */}
          {message && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">المعلومات الشخصية</h3>
              
              {/* Profile Image Section */}
              <div className="flex flex-col items-center space-y-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="صورة الملف الشخصي"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  
                  <label
                    htmlFor="profile-image-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer transition-colors"
                  >
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Camera className="w-4 h-4" />
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {uploadingImage ? 'جاري رفع الصورة...' : 'اضغط على أيقونة الكاميرا لتغيير الصورة'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    JPG, PNG أو GIF (حد أقصى 5 ميجابايت)
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الاسم الأول
                  </label>
                  <input
                    type="text"
                    value={personalInfo.first_name}
                    onChange={(e) => setPersonalInfo({...personalInfo, first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    اسم العائلة
                  </label>
                  <input
                    type="text"
                    value={personalInfo.last_name}
                    onChange={(e) => setPersonalInfo({...personalInfo, last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    المدينة
                  </label>
                  <input
                    type="text"
                    value={personalInfo.city}
                    onChange={(e) => setPersonalInfo({...personalInfo, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رقم الهوية
                  </label>
                  <input
                    type="text"
                    value={personalInfo.id_number}
                    onChange={(e) => setPersonalInfo({...personalInfo, id_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">تغيير كلمة المرور</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    كلمة المرور الحالية
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
              </button>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">إعدادات الإشعارات</h3>
              
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'الإشعارات عبر البريد الإلكتروني', description: 'تلقي إشعارات حول المواعيد والقضايا' },
                  { key: 'smsNotifications', label: 'الإشعارات عبر الرسائل النصية', description: 'تلقي إشعارات مهمة عبر SMS' },
                  { key: 'appointmentReminders', label: 'تذكيرات المواعيد', description: 'تذكير قبل المواعيد بساعة' },
                  { key: 'caseUpdates', label: 'تحديثات القضايا', description: 'إشعارات حول تطور القضايا' },
                  { key: 'marketingEmails', label: 'رسائل تسويقية', description: 'عروض وخدمات جديدة' }
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{setting.label}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{setting.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings[setting.key]}
                        onChange={(e) => handleNotificationChange(setting.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Management Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">إدارة الحساب</h3>
              
              {/* Deletion Request Status */}
              {deletionRequestStatus && (
                <div className={`p-4 rounded-lg border ${
                  deletionRequestStatus.status === 'pending' 
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                    : deletionRequestStatus.status === 'approved'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                }`}>
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <AlertCircle className={`w-5 h-5 mt-0.5 ${
                      deletionRequestStatus.status === 'pending' 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : deletionRequestStatus.status === 'approved'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`} />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {deletionRequestStatus.status === 'pending' && 'طلب حذف الحساب قيد المراجعة'}
                        {deletionRequestStatus.status === 'approved' && 'تم الموافقة على حذف الحساب'}
                        {deletionRequestStatus.status === 'rejected' && 'تم رفض طلب حذف الحساب'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {deletionRequestStatus.status === 'pending' && 'سيتم مراجعة طلبك من قبل الإدارة قريباً.'}
                        {deletionRequestStatus.status === 'approved' && 'سيتم حذف حسابك قريباً.'}
                        {deletionRequestStatus.status === 'rejected' && deletionRequestStatus.admin_notes && `السبب: ${deletionRequestStatus.admin_notes}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        تاريخ الطلب: {new Date(deletionRequestStatus.requested_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">حذف الحساب</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    طلب حذف حسابك نهائياً. سيتم مراجعة الطلب من قبل الإدارة.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deletionRequestStatus?.status === 'pending'}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletionRequestStatus?.status === 'pending' ? 'طلب الحذف قيد المراجعة' : 'طلب حذف الحساب'}
                  </button>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">تصدير البيانات</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    تحميل نسخة من جميع بياناتك الشخصية.
                  </p>
                  <button
                    onClick={() => alert('سيتم تنفيذ تصدير البيانات قريباً')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    تصدير البيانات
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-start space-x-3 space-x-reverse mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  طلب حذف الحساب
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  هل أنت متأكد من طلب حذف حسابك؟ سيتم مراجعة الطلب من قبل الإدارة.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                سبب طلب الحذف <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="يرجى كتابة سبب طلب حذف الحساب..."
              />
            </div>

            <div className="flex space-x-3 space-x-reverse">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || !deleteReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
