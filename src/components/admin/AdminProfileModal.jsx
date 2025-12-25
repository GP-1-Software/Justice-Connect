import React from 'react';
import { X, User, Mail, Phone, MapPin, CreditCard, Calendar, Shield, Crown } from 'lucide-react';

const AdminProfileModal = ({ adminData, onClose }) => {
    if (!adminData) return null;

    // Determine admin role display
    const getRoleDisplay = () => {
        if (adminData.role === 'super_admin') {
            return {
                label: 'Super Admin',
                color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                icon: Crown
            };
        }
        return {
            label: 'مسؤول',
            color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            icon: Shield
        };
    };

    const roleInfo = getRoleDisplay();
    const RoleIcon = roleInfo.icon;

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'غير محدد';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Handle backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={handleBackdropClick}
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full my-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-0">
                        <div className="bg-white/20 p-2 sm:p-3 rounded-full flex-shrink-0">
                            <User className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg sm:text-2xl font-bold truncate">
                                الملف الشخصي
                            </h2>
                            <p className="text-xs sm:text-sm text-blue-100">
                                معلومات حساب المسؤول
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition flex-shrink-0"
                        aria-label="إغلاق"
                    >
                        <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Profile Image and Name */}
                    <div className="flex flex-col items-center space-y-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-cyan-400 dark:from-blue-600 dark:to-cyan-600 flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-xl">
                            {adminData.profile_image_url ? (
                                <img
                                    src={adminData.profile_image_url}
                                    alt="صورة الملف الشخصي"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                            )}
                        </div>

                        <div className="text-center">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                {adminData.first_name} {adminData.last_name}
                            </h3>
                            <div className="flex items-center justify-center space-x-2 space-x-reverse mt-2">
                                <RoleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${roleInfo.color}`}>
                                    {roleInfo.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Information Grid */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center space-x-2 space-x-reverse">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 sm:p-2 rounded-lg">
                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span>المعلومات الشخصية</span>
                        </h3>

                        <div className="space-y-2">
                            {/* Email */}
                            <div className="flex items-start space-x-3 space-x-reverse p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">البريد الإلكتروني</p>
                                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-all">
                                        {adminData.email}
                                    </p>
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="flex items-start space-x-3 space-x-reverse p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">رقم الهاتف</p>
                                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white" dir="ltr">
                                        {adminData.phone}
                                    </p>
                                </div>
                            </div>

                            {/* City */}
                            {adminData.city && (
                                <div className="flex items-start space-x-3 space-x-reverse p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">المدينة</p>
                                        <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                                            {adminData.city}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ID Number */}
                            <div className="flex items-start space-x-3 space-x-reverse p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">رقم الهوية</p>
                                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white font-mono">
                                        {adminData.id_number}
                                    </p>
                                </div>
                            </div>

                            {/* Created At */}
                            <div className="flex items-start space-x-3 space-x-reverse p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">تاريخ الانضمام</p>
                                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                                        {formatDate(adminData.created_at)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default AdminProfileModal;
