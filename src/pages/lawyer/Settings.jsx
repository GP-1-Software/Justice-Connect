import React, { useState, useEffect } from 'react';
import { useLawyerAuth } from '../../hooks/useLawyerAuth';
import { AlertCircle, Shield, Bell, Trash2 } from 'lucide-react';
import { createDeletionRequest, getUserDeletionRequest } from '../../services/deletionRequestApi';

const Settings = () => {
  const { lawyer, changePassword } = useLawyerAuth();
  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    if (lawyer) {
      checkDeletionRequestStatus();
    }
  }, [lawyer]);

  const checkDeletionRequestStatus = async () => {
    if (!lawyer?.lawyer_id) return;

    const result = await getUserDeletionRequest(lawyer.lawyer_id, 'lawyer');
    if (result.success && result.data) {
      setDeletionRequestStatus(result.data);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('كلمات المرور الجديدة غير متطابقة');
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setLoading(false);
      return;
    }

    const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);

    if (result.success) {
      setMessage('تم تغيير كلمة المرور بنجاح');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setError(result.message || 'فشل تغيير كلمة المرور');
    }

    setLoading(false);
  };

  // Handle notification settings update
  const handleNotificationUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    // Here you would typically save to database
    // For now, just show success message
    setTimeout(() => {
      setMessage('تم حفظ إعدادات الإشعارات بنجاح');
      setLoading(false);
    }, 500);
  };

  // Handle account deletion request
  const handleDeleteRequest = async () => {
    if (!deleteReason.trim()) {
      setError('يرجى إدخال سبب حذف الحساب');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const result = await createDeletionRequest(
      lawyer.lawyer_id,
      'lawyer',
      deleteReason
    );

    if (result.success) {
      setMessage('تم إرسال طلب حذف الحساب بنجاح. سيتم مراجعته من قبل الإدارة.');
      setShowDeleteModal(false);
      setDeleteReason('');
      await checkDeletionRequestStatus();
    } else {
      setError(result.message || 'فشل إرسال طلب حذف الحساب');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-0">
      {/* Header with gradient */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 text-white shadow-lg">
          <div className="flex items-center space-x-3 sm:space-x-4 space-x-reverse">
            <div className="bg-white/20 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">الإعدادات</h1>
              <p className="text-blue-100 text-xs sm:text-sm lg:text-base">إدارة إعدادات الأمان والإشعارات والحساب</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl mb-4 sm:mb-6 border border-gray-100 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          <nav className="flex space-x-1 sm:space-x-2 lg:space-x-4 px-2 sm:px-4 lg:px-6 min-w-max" aria-label="Tabs">
            {[
              { id: 'security', name: 'الأمان', icon: <Shield className="h-4 w-4 sm:h-5 sm:w-5" /> },
              { id: 'notifications', name: 'الإشعارات', icon: <Bell className="h-4 w-4 sm:h-5 sm:w-5" /> },
              { id: 'account', name: 'إدارة الحساب', icon: <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${activeTab === tab.id
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  } whitespace-nowrap py-2.5 sm:py-3 lg:py-4 px-2.5 sm:px-3 lg:px-4 border-b-2 font-semibold text-xs sm:text-sm lg:text-base flex items-center space-x-1.5 sm:space-x-2 space-x-reverse rounded-t-lg transition-all touch-manipulation`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
        {/* Messages */}
        {message && (
          <div className="mb-3 sm:mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-3 sm:mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordChange} className="space-y-6 sm:space-y-8">
            <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg flex-shrink-0">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">تغيير كلمة المرور</h3>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="group">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2 space-x-reverse">
                  <span>كلمة المرور الحالية</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 sm:px-4 py-3 sm:py-3.5 pr-10 sm:pr-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all text-sm sm:text-base"
                    required
                    placeholder="أدخل كلمة المرور الحالية"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>

              </div>

              <div className="group">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2 space-x-reverse">
                  <span>كلمة المرور الجديدة</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 sm:px-4 py-3 sm:py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all text-sm sm:text-base"
                  required
                  minLength={6}
                  placeholder="أدخل كلمة المرور الجديدة"
                />

              </div>

              <div className="group">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2 space-x-reverse">
                  <span>تأكيد كلمة المرور الجديدة</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 sm:px-4 py-3 sm:py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all text-sm sm:text-base"
                  required
                  minLength={6}
                  placeholder="أعد إدخال كلمة المرور"
                />

              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 space-x-reverse text-sm sm:text-base touch-manipulation"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>جاري التحديث...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span>تغيير كلمة المرور</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <form onSubmit={handleNotificationUpdate} className="space-y-5 sm:space-y-6">
            <div className="flex items-center space-x-2 space-x-reverse pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg flex-shrink-0">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">إعدادات الإشعارات</h3>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">إشعارات البريد الإلكتروني</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">تلقي الإشعارات عبر البريد الإلكتروني</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">إشعارات الرسائل النصية</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">تلقي الإشعارات عبر الرسائل النصية</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={notificationSettings.smsNotifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">تذكير بالمواعيد</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">تلقي تذكير قبل المواعيد</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={notificationSettings.appointmentReminders}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, appointmentReminders: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">تحديثات القضايا</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">تلقي إشعارات عن تحديثات القضايا</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={notificationSettings.caseUpdates}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, caseUpdates: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">رسائل تسويقية</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">تلقي عروض وأخبار المنصة</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={notificationSettings.marketingEmails}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, marketingEmails: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="pt-4 sm:pt-5 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base touch-manipulation"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </form>
        )}

        {/* Account Management Tab */}
        {activeTab === 'account' && (
          <div className="space-y-5 sm:space-y-6">
            <div className="flex items-center space-x-2 space-x-reverse pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg flex-shrink-0">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">إدارة الحساب</h3>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 lg:p-5">
              <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-base sm:text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                    حذف الحساب
                  </h4>
                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mb-4 leading-relaxed">
                    حذف حسابك سيؤدي إلى إزالة جميع بياناتك بشكل دائم. هذا الإجراء لا يمكن التراجع عنه.
                  </p>

                  {deletionRequestStatus ? (
                    <div className={`${deletionRequestStatus.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'} border rounded-lg p-3 sm:p-4 mb-4`}>
                      <p className={`text-xs sm:text-sm font-semibold ${deletionRequestStatus.status === 'rejected' ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'} mb-1`}>
                        <strong>حالة الطلب:</strong> {deletionRequestStatus.status === 'pending' ? 'قيد المراجعة' : deletionRequestStatus.status === 'rejected' ? 'مرفوض' : deletionRequestStatus.status}
                      </p>
                      <p className={`text-xs ${deletionRequestStatus.status === 'rejected' ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'} mt-1`}>
                        تاريخ الطلب: {new Date(deletionRequestStatus.requested_at).toLocaleDateString('ar-EG')}
                      </p>
                      {deletionRequestStatus.status === 'rejected' && deletionRequestStatus.admin_notes && (
                        <div className="mt-3 p-2 sm:p-3 bg-red-100 dark:bg-red-900/40 rounded-lg">
                          <p className="text-xs sm:text-sm text-red-800 dark:text-red-200 leading-relaxed">
                            <strong>سبب الرفض:</strong> {deletionRequestStatus.admin_notes}
                          </p>
                        </div>
                      )}
                      {deletionRequestStatus.status === 'rejected' && (
                        <button
                          onClick={() => setDeletionRequestStatus(null)}
                          className="mt-3 w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base font-semibold transition-all touch-manipulation"
                        >
                          إعادة تقديم الطلب
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base font-semibold transition-all shadow-lg hover:shadow-xl touch-manipulation"
                    >
                      طلب حذف الحساب
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              تأكيد حذف الحساب
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 leading-relaxed">
              يرجى إدخال سبب حذف الحساب. سيتم مراجعة طلبك من قبل الإدارة.
            </p>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="سبب حذف الحساب..."
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4 text-sm sm:text-base resize-none"
              rows={4}
              required
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleDeleteRequest}
                disabled={loading}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 font-semibold text-sm sm:text-base transition-all touch-manipulation"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                }}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold text-sm sm:text-base transition-all touch-manipulation"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
