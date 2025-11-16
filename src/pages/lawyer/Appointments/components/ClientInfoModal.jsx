import React from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, Hash, Shield } from 'lucide-react';

const ClientInfoModal = ({ isOpen, onClose, client }) => {
  if (!isOpen || !client) return null;

  const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold">معلومات العميل</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Profile Section */}
          <div className="flex items-center space-x-4 space-x-reverse mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            {client.profile_image_url ? (
              <img
                src={client.profile_image_url}
                alt={fullName}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-100 dark:ring-blue-900/20"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center ring-4 ring-blue-100 dark:ring-blue-900/20">
                <User className="h-10 w-10 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {fullName || 'غير محدد'}
              </h3>
              {(client.account_status === 'active' || client.account_status === 'pending') && (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    client.account_status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    <Shield className="h-3 w-3 ml-1" />
                    {client.account_status === 'active' ? 'نشط' : 'قيد المراجعة'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            {client.email && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">البريد الإلكتروني</span>
                </div>
                <p className="text-gray-900 dark:text-white font-medium" dir="ltr">
                  {client.email}
                </p>
              </div>
            )}

            {/* Phone */}
            {client.phone && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">رقم الهاتف</span>
                </div>
                <p className="text-gray-900 dark:text-white font-medium" dir="ltr">
                  {client.phone}
                </p>
              </div>
            )}

            {/* City */}
            {client.city && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">المدينة</span>
                </div>
                <p className="text-gray-900 dark:text-white font-medium">
                  {client.city}
                </p>
              </div>
            )}

            {/* ID Number */}
            {client.id_number && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <Hash className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">رقم الهوية</span>
                </div>
                <p className="text-gray-900 dark:text-white font-medium font-mono" dir="ltr">
                  {client.id_number}
                </p>
              </div>
            )}

            {/* User ID */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">معرف المستخدم</span>
              </div>
              <p className="text-gray-900 dark:text-white font-medium font-mono">
                #{client.user_id}
              </p>
            </div>

            {/* Created At */}
            {client.created_at && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">تاريخ التسجيل</span>
                </div>
                <p className="text-gray-900 dark:text-white font-medium">
                  {new Date(client.created_at).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>

          {/* User Type */}
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">نوع المستخدم</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                {client.user_type === 'client' ? 'عميل' : client.user_type}
              </span>
            </div>
          </div>

          {/* Rejection Reason (if any) */}
          {client.rejection_reason && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                سبب الرفض:
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                {client.rejection_reason}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientInfoModal;
