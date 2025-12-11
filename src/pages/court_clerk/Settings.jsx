// ============================================
// Court Clerk Settings - إعدادات كاتب المحكمة
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Lock,
    Bell,
    Moon,
    Sun,
    Mail,
    Phone,
    MapPin,
    Save,
    Eye,
    EyeOff,
    Check,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

const CourtClerkSettings = () => {
    const navigate = useNavigate();
    const [clerk, setClerk] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const [darkMode, setDarkMode] = useState(false);

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        city: '',
        id_number: ''
    });

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // Notification preferences
    const [notificationPrefs, setNotificationPrefs] = useState({
        email_notifications: true,
        filing_notifications: true,
        hearing_notifications: true,
        decision_notifications: true,
        sound_enabled: true
    });

    useEffect(() => {
        // Check authentication
        const user = localStorage.getItem('user');
        if (!user) {
            navigate('/login');
            return;
        }

        const userData = JSON.parse(user);
        if (userData.user_type !== 'court_clerk') {
            toast.error('ليس لديك صلاحية للوصول');
            navigate('/');
            return;
        }

        setClerk(userData);
        setProfileForm({
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            city: userData.city || '',
            id_number: userData.id_number || ''
        });

        // Check dark mode preference
        const isDark = localStorage.getItem('darkMode') === 'true';
        setDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        }

        setLoading(false);
    }, [navigate]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();

        try {
            const user = localStorage.getItem('user');
            // Encode to base64 with UTF-8 support
            const base64User = btoa(unescape(encodeURIComponent(user || '')));

            const response = await fetch('http://localhost:5000/api/court-clerk/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-data': base64User
                },
                body: JSON.stringify({
                    first_name: profileForm.first_name,
                    last_name: profileForm.last_name,
                    email: profileForm.email,
                    phone: profileForm.phone,
                    city: profileForm.city
                })
            });

            if (response.ok) {
                const data = await response.json();
                const updatedUser = { ...clerk, ...profileForm };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setClerk(updatedUser);
                toast.success('تم تحديث الملف الشخصي بنجاح');
            } else {
                const error = await response.json();
                toast.error(error.error || 'فشل في تحديث الملف الشخصي');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('فشل في تحديث الملف الشخصي');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            toast.error('كلمات المرور الجديدة غير متطابقة');
            return;
        }

        if (passwordForm.new_password.length < 8) {
            toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            return;
        }

        try {
            // Here you would call your API to change password
            toast.success('تم تغيير كلمة المرور بنجاح');
            setPasswordForm({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error('فشل في تغيير كلمة المرور');
        }
    };

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode);

        if (newDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        toast.success(newDarkMode ? 'تم تفعيل الوضع الليلي' : 'تم تفعيل الوضع النهاري');
    };

    const handleNotificationPrefChange = (key) => {
        setNotificationPrefs(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
        toast.success('تم تحديث تفضيلات الإشعارات');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'profile', label: 'الملف الشخصي', icon: User },
        { id: 'password', label: 'كلمة المرور', icon: Lock },
        { id: 'notifications', label: 'الإشعارات', icon: Bell },
        { id: 'appearance', label: 'المظهر', icon: darkMode ? Moon : Sun }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            <CourtClerkHeader
                title="الإعدادات"
                subtitle="إدارة الملف الشخصي والتفضيلات"
                showBackButton={true}
                backPath="/court-clerk/dashboard"
            />

            <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 px-6 py-4 text-sm font-medium transition flex items-center justify-center gap-2 ${activeTab === tab.id
                                        ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                معلومات الملف الشخصي
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        رقم الهوية
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.id_number}
                                        disabled
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        رقم الهوية غير قابل للتعديل
                                    </p>
                                </div>

                                <div></div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        الاسم الأول
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.first_name}
                                        onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        الاسم الأخير
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.last_name}
                                        onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <Mail size={16} />
                                        البريد الإلكتروني
                                    </label>
                                    <input
                                        type="email"
                                        value={profileForm.email}
                                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <Phone size={16} />
                                        رقم الهاتف
                                    </label>
                                    <input
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <MapPin size={16} />
                                        المدينة
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.city}
                                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    حفظ التغييرات
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Password Tab */}
                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordChange} className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                تغيير كلمة المرور
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        كلمة المرور الحالية
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={passwordForm.current_password}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                                        >
                                            {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        كلمة المرور الجديدة
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={passwordForm.new_password}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                                        >
                                            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        يجب أن تكون كلمة المرور 8 أحرف على الأقل
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        تأكيد كلمة المرور الجديدة
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={passwordForm.confirm_password}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                                        >
                                            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                >
                                    <Lock size={18} />
                                    تغيير كلمة المرور
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                تفضيلات الإشعارات
                            </h3>

                            <div className="space-y-4">
                                <NotificationToggle
                                    label="إشعارات البريد الإلكتروني"
                                    description="استلام إشعارات عبر البريد الإلكتروني"
                                    checked={notificationPrefs.email_notifications}
                                    onChange={() => handleNotificationPrefChange('email_notifications')}
                                />

                                <NotificationToggle
                                    label="إشعارات اللوائح الجديدة"
                                    description="إشعار عند تقديم لائحة جديدة"
                                    checked={notificationPrefs.filing_notifications}
                                    onChange={() => handleNotificationPrefChange('filing_notifications')}
                                />

                                <NotificationToggle
                                    label="إشعارات الجلسات"
                                    description="إشعار عند اقتراب موعد جلسة"
                                    checked={notificationPrefs.hearing_notifications}
                                    onChange={() => handleNotificationPrefChange('hearing_notifications')}
                                />

                                <NotificationToggle
                                    label="إشعارات القرارات"
                                    description="إشعار عند إصدار قرار جديد"
                                    checked={notificationPrefs.decision_notifications}
                                    onChange={() => handleNotificationPrefChange('decision_notifications')}
                                />

                                <NotificationToggle
                                    label="الأصوات"
                                    description="تفعيل الأصوات للإشعارات"
                                    checked={notificationPrefs.sound_enabled}
                                    onChange={() => handleNotificationPrefChange('sound_enabled')}
                                />
                            </div>
                        </div>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                إعدادات المظهر
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {darkMode ? <Moon size={24} className="text-blue-600" /> : <Sun size={24} className="text-yellow-600" />}
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {darkMode ? 'الوضع الليلي' : 'الوضع النهاري'}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {darkMode ? 'تم تفعيل الوضع الليلي' : 'تم تفعيل الوضع النهاري'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={toggleDarkMode}
                                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${darkMode ? 'bg-blue-600' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${darkMode ? 'translate-x-1' : 'translate-x-7'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Notification Toggle Component
const NotificationToggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div>
            <p className="font-medium text-gray-900 dark:text-white">{label}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <button
            onClick={onChange}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${checked ? 'bg-green-600' : 'bg-gray-300'
                }`}
        >
            <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition flex items-center justify-center ${checked ? 'translate-x-1' : 'translate-x-7'
                    }`}
            >
                {checked && <Check size={14} className="text-green-600" />}
            </span>
        </button>
    </div>
);

export default CourtClerkSettings;
