import { FileText, User, Scale, Calendar, AlertCircle, Info, Mail, Phone, MapPin, Award, Briefcase } from 'lucide-react';

const CaseOverview = ({ caseData, lawyer }) => {
  const caseTypeLabels = {
    'civil': 'مدنية',
    'criminal': 'جنائية',
    'commercial': 'تجارية',
    'family': 'أحوال شخصية',
    'labor': 'عمالية',
    'administrative': 'إدارية'
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Description */}
      <div className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">وصف القضية</h2>
        </div>
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {caseData?.description || 'لا يوجد وصف متاح'}
        </p>
      </div>

      {/* Case Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Case Details */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-xl lg:rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5 lg:p-6">
          <div className="flex items-center gap-2 mb-5">
            <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">معلومات القضية</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">نوع القضية</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {caseTypeLabels[caseData?.case_type] || caseData?.case_type}
              </span>
            </div>

            <div className="flex items-start justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">رقم القضية</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                #{caseData?.case_number || caseData?.case_id}
              </span>
            </div>

            {caseData?.court_name && (
              <div className="flex items-start justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">المحكمة</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white text-left">
                  {caseData.court_name}
                </span>
              </div>
            )}

            <div className="flex items-start justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">تاريخ الإنشاء</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatDate(caseData?.created_at)}
              </span>
            </div>

            {caseData?.filing_date && (
              <div className="flex items-start justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">تاريخ التقديم</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatDate(caseData.filing_date)}
                </span>
              </div>
            )}

            {caseData?.next_hearing_date && (
              <div className="flex items-start justify-between py-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">الجلسة القادمة</span>
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                  {formatDate(caseData.next_hearing_date)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Lawyer Information */}
        {lawyer && (
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-xl lg:rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5 lg:p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">معلومات المحامي</h3>
            </div>

            {/* Lawyer Avatar and Name */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center flex-shrink-0 shadow-md">
                {lawyer.profile_image_url ? (
                  <img
                    src={lawyer.profile_image_url}
                    alt={`${lawyer.first_name} ${lawyer.last_name}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {lawyer.first_name} {lawyer.last_name}
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{lawyer.specialization}</span>
                </div>
                {lawyer.years_of_experience && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                    <Award className="w-3.5 h-3.5" />
                    <span>{lawyer.years_of_experience} سنوات خبرة</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              {lawyer.email && (
                <div className="flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">البريد الإلكتروني</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {lawyer.email}
                    </p>
                  </div>
                </div>
              )}

              {lawyer.phone && (
                <div className="flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700">
                  <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">رقم الهاتف</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white" dir="ltr">
                      {lawyer.phone}
                    </p>
                  </div>
                </div>
              )}

              {lawyer.city && (
                <div className="flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">المدينة</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {lawyer.city}
                    </p>
                  </div>
                </div>
              )}

              {lawyer.license_number && (
                <div className="flex items-center gap-3 py-3">
                  <Award className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">رقم الترخيص</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {lawyer.license_number}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {lawyer.bio && (
              <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">نبذة عن المحامي</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {lawyer.bio}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rejection Reason (if any) */}
      {caseData?.status === 'rejected' && caseData?.rejection_reason && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg sm:rounded-xl border-2 border-red-200 dark:border-red-800 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm sm:text-base font-bold text-red-900 dark:text-red-300 mb-2">سبب الرفض</h4>
              <p className="text-xs sm:text-sm text-red-800 dark:text-red-400">
                {caseData.rejection_reason}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseOverview;
