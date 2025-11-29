import React, { useState, useEffect } from 'react';
import { Shield, Bell, MessageCircle, Briefcase, Calendar, DollarSign, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';

/**
 * Notification Settings Page - مطابق للتصميم
 */
const NotificationSettings = ({ userId, userType }) => {
    const [settings, setSettings] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load preferences from backend
    useEffect(() => {
        const loadPreferences = async () => {
            if (!userId || !userType) return;

            try {
                const { data, error } = await supabase
                    .from('notification_preferences')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('user_type', userType)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;

                // If no preferences exist, create default ones
                if (!data) {
                    const defaultPrefs = {
                        user_id: userId,
                        user_type: userType,
                        enable_message_notifications: true,
                        enable_case_notifications: true,
                        enable_appointment_notifications: true,
                        enable_payment_notifications: true,
                        enable_reminder_notifications: true,
                        enable_sound: true
                    };

                    const { data: newData, error: insertError } = await supabase
                        .from('notification_preferences')
                        .insert([defaultPrefs])
                        .select()
                        .single();

                    if (insertError) throw insertError;
                    setSettings(newData);
                } else {
                    setSettings(data);
                }
            } catch (error) {
                console.error('Error loading preferences:', error);
                toast.error('فشل في تحميل الإعدادات');
            } finally {
                setLoading(false);
            }
        };

        loadPreferences();
    }, [userId, userType]);

    const handleToggle = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const { error } = await supabase
                .from('notification_preferences')
                .update({
                    enable_message_notifications: settings.enable_message_notifications,
                    enable_case_notifications: settings.enable_case_notifications,
                    enable_appointment_notifications: settings.enable_appointment_notifications,
                    enable_payment_notifications: settings.enable_payment_notifications,
                    enable_reminder_notifications: settings.enable_reminder_notifications,
                    enable_sound: settings.enable_sound,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('user_type', userType);

            if (error) throw error;

            toast.success('تم حفظ الإعدادات بنجاح');
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast.error('فشل في حفظ الإعدادات');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !settings) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const ToggleSwitch = ({ enabled, onChange }) => (
        <button
            onClick={onChange}
            className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
            `}
        >
            <span
                className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${enabled ? 'translate-x-6' : 'translate-x-1'}
                `}
            />
        </button>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8" />
                        <div>
                            <h1 className="text-2xl font-bold">الإعدادات</h1>
                            <p className="text-blue-100">إدارة إعدادات الإشعارات والحساب</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Tabs */}
                <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow">
                    <button className="flex-1 px-4 py-2 rounded-md bg-blue-600 text-white font-medium">
                        الإشعارات
                    </button>
                    <button className="flex-1 px-4 py-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">
                        الأمان
                    </button>
                    <button className="flex-1 px-4 py-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">
                        إدارة الحساب
                    </button>
                </div>

                {/* إعدادات الإشعارات */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <Bell className="w-5 h-5" />
                            <h2 className="text-lg font-semibold">إعدادات الإشعارات</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* إشعارات البريد الإلكتروني */}
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <MessageCircle className="w-5 h-5 text-blue-600" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        إشعارات البريد الإلكتروني
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        تلقي الإشعارات عبر البريد الإلكتروني
                                    </p>
                                </div>
                            </div>
                            <ToggleSwitch
                                enabled={settings.enable_message_notifications}
                                onChange={() => handleToggle('enable_message_notifications')}
                            />
                        </div>

                        {/* إشعارات الرسائل النصية */}
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <MessageCircle className="w-5 h-5 text-green-600" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        إشعارات الرسائل النصية
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        تلقي الإشعارات عبر الرسائل النصية
                                    </p>
                                </div>
                            </div>
                            <ToggleSwitch
                                enabled={false}
                                onChange={() => { }}
                            />
                        </div>

                        {/* تذكير بالمواعيد */}
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-orange-600" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        تذكير بالمواعيد
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        تلقي تذكير قبل المواعيد
                                    </p>
                                </div>
                            </div>
                            <ToggleSwitch
                                enabled={settings.enable_reminder_notifications}
                                onChange={() => handleToggle('enable_reminder_notifications')}
                            />
                        </div>

                        {/* تحديثات القضايا */}
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <Briefcase className="w-5 h-5 text-purple-600" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        تحديثات القضايا
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        تلقي إشعارات عن تحديثات القضايا
                                    </p>
                                </div>
                            </div>
                            <ToggleSwitch
                                enabled={settings.enable_case_notifications}
                                onChange={() => handleToggle('enable_case_notifications')}
                            />
                        </div>

                        {/* رسائل سريعة */}
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <DollarSign className="w-5 h-5 text-yellow-600" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        رسائل سريعة
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        تلقي عروض وإعلانات المنصة
                                    </p>
                                </div>
                            </div>
                            <ToggleSwitch
                                enabled={settings.enable_payment_notifications}
                                onChange={() => handleToggle('enable_payment_notifications')}
                            />
                        </div>

                        {/* تفعيل الأصوات */}
                        <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="flex items-center gap-3">
                                <Bell className="w-5 h-5 text-red-600" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        تفعيل الأصوات
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        تشغيل صوت عند وصول إشعار جديد
                                    </p>
                                </div>
                            </div>
                            <ToggleSwitch
                                enabled={settings.enable_sound}
                                onChange={() => handleToggle('enable_sound')}
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettings;
