import React, { useState } from 'react';
import {
  X,
  User,
  Briefcase,
  Calendar,
  FileText,
  MapPin,
  Phone,
  Mail,
  Clock,
  AlertCircle,
  Download,
  Eye
} from 'lucide-react';

const CaseDetailsModal = ({ caseData, onClose, onUpdateStatus }) => {
  const [selectedStatus, setSelectedStatus] = useState(caseData.status);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!caseData) return null;

  const statuses = [
    { value: 'pending', label: 'معلقة' },
    { value: 'active', label: 'نشطة' },
    { value: 'in_progress', label: 'قيد المعالجة' },
    { value: 'completed', label: 'مكتملة' },
    { value: 'closed', label: 'مغلقة' },
    { value: 'rejected', label: 'مرفوضة' }
  ];

  const handleUpdateStatus = async () => {
    if (selectedStatus === caseData.status) return;
    
    setIsUpdating(true);
    try {
      await onUpdateStatus(caseData.case_id, selectedStatus);
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 sm:p-6 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-0">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold truncate">{caseData.title}</h2>
              {caseData.case_number && (
                <p className="text-sm text-blue-100">رقم القضية: {caseData.case_number}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition flex-shrink-0"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status Update Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              تحديث حالة القضية
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleUpdateStatus}
                disabled={isUpdating || selectedStatus === caseData.status}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isUpdating ? 'جاري التحديث...' : 'تحديث الحالة'}
              </button>
            </div>
          </div>

          {/* Case Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Information */}
            {caseData.client && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    معلومات العميل
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">الاسم: </span>
                    <span className="text-gray-900 dark:text-white">
                      {caseData.client.first_name} {caseData.client.last_name}
                    </span>
                  </p>
                  {caseData.client.id_number && (
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">رقم الهوية: </span>
                      <span className="text-gray-900 dark:text-white font-mono">
                        {caseData.client.id_number}
                      </span>
                    </p>
                  )}
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{caseData.client.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{caseData.client.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{caseData.client.city}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Lawyer Information */}
            {caseData.lawyer ? (
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    معلومات المحامي
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">الاسم: </span>
                    <span className="text-gray-900 dark:text-white">
                      {caseData.lawyer.first_name} {caseData.lawyer.last_name}
                    </span>
                  </p>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{caseData.lawyer.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{caseData.lawyer.phone}</span>
                  </div>
                  {caseData.lawyer.specialization && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {caseData.lawyer.specialization.map((spec, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">لم يتم تعيين محامي بعد</p>
                </div>
              </div>
            )}
          </div>

          {/* Case Details */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              تفاصيل القضية
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">نوع القضية</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {caseData.case_type || 'غير محدد'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">الأولوية</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {caseData.priority === 'high' ? 'عالية' : 
                   caseData.priority === 'medium' ? 'متوسطة' : 
                   caseData.priority === 'low' ? 'منخفضة' : 'غير محدد'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">تاريخ الإنشاء</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {new Date(caseData.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
              {caseData.filing_date && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">تاريخ التقديم</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {new Date(caseData.filing_date).toLocaleDateString('en-GB')}
                  </p>
                </div>
              )}
              {caseData.next_hearing_date && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">الجلسة القادمة</p>
                  <p className="text-base font-semibold text-orange-600 dark:text-orange-400">
                    {new Date(caseData.next_hearing_date).toLocaleDateString('en-GB')}
                  </p>
                </div>
              )}
              {caseData.court_name && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">اسم المحكمة</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {caseData.court_name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {caseData.description && (
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                الوصف
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {caseData.description}
              </p>
            </div>
          )}

          {/* Files */}
          {caseData.case_files && caseData.case_files.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                الملفات المرفقة ({caseData.case_files.length})
              </h3>
              <div className="space-y-2">
                {caseData.case_files.map((file) => (
                  <div
                    key={file.file_id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {file.file_name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(file.created_at).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                    </div>
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition flex-shrink-0"
                    >
                      <Eye className="h-5 w-5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseDetailsModal;
