import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, CreditCard, AlertCircle, Loader2, Info, FileText, Award, Briefcase } from 'lucide-react';
import { supabase } from '../../../../supabaseClient';
import AddClientInfo from './AddClientInfo';

const ClientInfo = ({ caseData, lawyerId }) => {
  const [clientData, setClientData] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (caseData) {
      fetchClientDetails();
    }
  }, [caseData, refreshKey]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      let userData = null;
      let detailsData = null;

      // Check if we have client_id (case created by client or linked to existing client)
      if (caseData.client_id) {
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', caseData.client_id)
          .eq('user_type', 'client')
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('لم يتم العثور على عميل');
          } else {
            throw fetchError;
          }
          return;
        }
        userData = data;

        // Try to fetch additional details from user_details table
        const { data: details, error: detailsError } = await supabase
          .from('user_details')
          .select('*')
          .eq('user_id', userData.user_id)
          .maybeSingle();

        if (detailsError && detailsError.code !== 'PGRST116') {
          console.error('Error fetching user details:', detailsError);
        }
        
        detailsData = details;
      }
      // Or try to fetch by id_number (case created by lawyer with id_number)
      else if (caseData.client_id_number) {
        // First try user_details table
        const { data: details, error: detailsError } = await supabase
          .from('user_details')
          .select('*')
          .eq('id_number', caseData.client_id_number)
          .maybeSingle();

        if (detailsError && detailsError.code !== 'PGRST116') {
          console.error('Error fetching user details by id_number:', detailsError);
        }
        
        detailsData = details;

        // If found in user_details and has user_id, fetch user data
        if (detailsData?.user_id) {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', detailsData.user_id)
            .eq('user_type', 'client')
            .maybeSingle();

          if (userError && userError.code !== 'PGRST116') {
            console.error('Error fetching user by user_id:', userError);
          }
          userData = user;
        }
        // If not found in user_details, try users table directly
        else {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id_number', caseData.client_id_number)
            .eq('user_type', 'client')
            .maybeSingle();

          if (userError && userError.code !== 'PGRST116') {
            console.error('Error fetching user by id_number:', userError);
          }
          userData = user;
        }
      }
      // If no client_id or client_id_number, try to fetch by case_number from user_details
      else if (caseData.case_number) {
        const { data: details, error: detailsError } = await supabase
          .from('user_details')
          .select('*')
          .eq('case_number', caseData.case_number)
          .maybeSingle();

        if (detailsError && detailsError.code !== 'PGRST116') {
          console.error('Error fetching user details by case_number:', detailsError);
        }
        
        detailsData = details;

        // If found and has user_id, fetch user data
        if (detailsData?.user_id) {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', detailsData.user_id)
            .eq('user_type', 'client')
            .maybeSingle();

          if (userError && userError.code !== 'PGRST116') {
            console.error('Error fetching user by user_id:', userError);
          }
          userData = user;
        }
      } else {
        // No client information available
        setClientData(null);
        setClientDetails(null);
        return;
      }

      setClientData(userData);
      setClientDetails(detailsData);
    } catch (err) {
      console.error('Error fetching client details:', err);
      setError('حدث خطأ أثناء جلب بيانات العميل');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Don't render anything if no case data
  if (!caseData) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  // Show AddClientInfo in edit mode if:
  // 1. No client linked AND no details in user_details
  const shouldShowAddForm = !caseData.client_id && !clientDetails && !clientData;

  if (shouldShowAddForm) {
    // Show AddClientInfo component when client is not found or not linked
    return (
      <AddClientInfo 
        clientIdNumber={caseData?.client_id_number}
        caseNumber={caseData?.case_number}
        lawyerId={lawyerId}
        onClientAdded={() => setRefreshKey(prev => prev + 1)}
      />
    );
  }

  // If editing mode, show AddClientInfo
  if (isEditing) {
    return (
      <AddClientInfo 
        clientIdNumber={clientDetails?.id_number || caseData?.client_id_number}
        caseNumber={caseData?.case_number}
        lawyerId={lawyerId}
        onClientAdded={() => {
          setIsEditing(false);
          setRefreshKey(prev => prev + 1);
        }}
      />
    );
  }

  const caseTypeLabels = {
    'civil': 'مدنية',
    'criminal': 'جنائية',
    'commercial': 'تجارية',
    'family': 'أحوال شخصية',
    'labor': 'عمالية',
    'administrative': 'إدارية'
  };

  // If we have some client info (either from users or user_details), show it
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* وصف القضية */}
      <div className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">وصف القضية</h2>
        </div>
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {caseData?.description || 'لا يوجد وصف متاح'}
        </p>
      </div>

      {/* معلومات القضية والعميل - Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* معلومات القضية */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-xl lg:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-5 lg:p-6">
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

        {/* معلومات العميل */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-xl lg:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-5 lg:p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">معلومات العميل</h3>
            </div>
            {/* زر تعديل */}
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-all transform hover:scale-105 text-xs sm:text-sm font-medium shadow-md"
            >
              تعديل
            </button>
          </div>

          {/* Client Avatar and Name */}
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center flex-shrink-0 shadow-md">
              {clientData?.profile_image_url ? (
                <img
                  src={clientData.profile_image_url}
                  alt={clientData.first_name ? `${clientData.first_name} ${clientData.last_name}` : 'عميل'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {clientDetails?.first_name || clientData?.first_name 
                  ? `${clientDetails?.first_name || clientData?.first_name} ${clientDetails?.last_name || clientData?.last_name}` 
                  : 'عميل'}
              </h4>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium">
                عميل
              </span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            {/* ID Number */}
            {(clientDetails?.id_number || clientData?.id_number) && (
              <div className="flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700">
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">رقم الهوية</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white" dir="ltr">
                    {clientDetails?.id_number || clientData?.id_number}
                  </p>
                </div>
              </div>
            )}

            {/* Email */}
            {(clientDetails?.email || clientData?.email) && (
              <div className="flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700">
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">البريد الإلكتروني</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {clientDetails?.email || clientData?.email}
                  </p>
                </div>
              </div>
            )}

            {/* Phone */}
            {(clientDetails?.phone_number || clientData?.phone) && (
              <div className="flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700">
                <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">رقم الهاتف</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white" dir="ltr">
                    {clientDetails?.phone_number || clientData?.phone}
                  </p>
                </div>
              </div>
            )}

            {/* City */}
            {(clientDetails?.city || clientData?.city) && (
              <div className="flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">المدينة</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {clientDetails?.city || clientData?.city}
                  </p>
                </div>
              </div>
            )}

            {/* Created At */}
            {clientData?.created_at && (
              <div className="flex items-center gap-3 py-3">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">تاريخ التسجيل</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(clientData.created_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* سبب الرفض (إن وجد) */}
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

export default ClientInfo;
