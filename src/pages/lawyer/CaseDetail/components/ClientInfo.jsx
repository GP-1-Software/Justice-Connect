import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../../../supabaseClient';

const ClientInfo = ({ caseData }) => {
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (caseData) {
      fetchClientDetails();
    }
  }, [caseData]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have client_id (case created by client)
      if (caseData.client_id) {
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', caseData.client_id)
          .eq('user_type', 'client')
          .single();

        if (fetchError) throw fetchError;
        setClientData(data);
      } 
      // Otherwise check if we have client_id_number (case created by lawyer)
      else if (caseData.client_id_number) {
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id_number', caseData.client_id_number)
          .eq('user_type', 'client')
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('لم يتم العثور على عميل بهذا الرقم');
          } else {
            throw fetchError;
          }
          return;
        }
        setClientData(data);
      } else {
        // No client information available
        setClientData(null);
      }
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

  // Don't render anything if no client info is available
  if (!caseData?.client_id && !caseData?.client_id_number) {
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

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold text-red-900 dark:text-red-100 mb-1">
              تعذر جلب بيانات العميل
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-base font-bold text-gray-900 dark:text-white">معلومات العميل</h3>
      </div>

      {/* Client Avatar and Name */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center flex-shrink-0 shadow-md">
          {clientData.profile_image_url ? (
            <img
              src={clientData.profile_image_url}
              alt={`${clientData.first_name} ${clientData.last_name}`}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            {clientData.first_name} {clientData.last_name}
          </h4>
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium">
            عميل
          </span>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        {/* ID Number */}
        {clientData.id_number && (
          <div className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700/50">
            <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">رقم الهوية</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white" dir="ltr">
                {clientData.id_number}
              </p>
            </div>
          </div>
        )}

        {/* Email */}
        {clientData.email && (
          <div className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700/50">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">البريد الإلكتروني</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {clientData.email}
              </p>
            </div>
          </div>
        )}

        {/* Phone */}
        {clientData.phone && (
          <div className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700/50">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">رقم الهاتف</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white" dir="ltr">
                {clientData.phone}
              </p>
            </div>
          </div>
        )}

        {/* City */}
        {clientData.city && (
          <div className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700/50">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">المدينة</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {clientData.city}
              </p>
            </div>
          </div>
        )}

        {/* Created At */}
        <div className="flex items-center gap-2 py-2">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">تاريخ التسجيل</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(clientData.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientInfo;
