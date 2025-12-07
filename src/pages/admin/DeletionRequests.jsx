import React, { useState, useEffect } from 'react';
import { getPendingDeletionRequests, updateDeletionRequestStatus } from '../../services/deletionRequestApi';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

const DeletionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const result = await getPendingDeletionRequests();
      if (result.success) {
        setRequests(result.data || []);
      } else {
        setError('فشل تحميل طلبات الحذف');
      }
    } catch (error) {
      console.error('Error fetching deletion requests:', error);
      setError('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('هل أنت متأكد من الموافقة على حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    setProcessing(true);
    setError('');
    setMessage('');

    try {
      // Get admin ID from localStorage (you should get this from your auth system)
      const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
      const adminId = adminData.admin_id || 1; // Fallback to 1 if not found

      const result = await updateDeletionRequestStatus(
        requestId,
        'approved',
        adminId,
        adminNotes || 'تمت الموافقة على حذف الحساب'
      );

      if (result.success) {
        setMessage('تمت الموافقة على حذف الحساب بنجاح');
        setSelectedRequest(null);
        setAdminNotes('');
        fetchRequests(); // Refresh the list
      } else {
        setError(result.error || 'فشل الموافقة على الطلب');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      setError('حدث خطأ في الموافقة على الطلب');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!adminNotes.trim()) {
      setError('يرجى كتابة سبب الرفض');
      return;
    }

    setProcessing(true);
    setError('');
    setMessage('');

    try {
      const adminData = JSON.parse(localStorage.getItem('admin') || '{}');
      const adminId = adminData.admin_id || 1;

      const result = await updateDeletionRequestStatus(
        requestId,
        'rejected',
        adminId,
        adminNotes
      );

      if (result.success) {
        setMessage('تم رفض الطلب بنجاح');
        setSelectedRequest(null);
        setAdminNotes('');
        fetchRequests();
      } else {
        setError(result.error || 'فشل رفض الطلب');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError('حدث خطأ في رفض الطلب');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'approved':
        return 'text-red-600 dark:text-red-400';
      case 'rejected':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5" />;
      case 'rejected':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                طلبات حذف الحسابات
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                إدارة طلبات حذف حسابات المستخدمين
              </p>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                {requests.length} طلب معلق
              </div>
            </div>
          </div>
        </div>

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

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              لا توجد طلبات حذف
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              لا توجد طلبات حذف حسابات معلقة حالياً
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.request_id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 space-x-reverse mb-3">
                      <div className={`${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {request.users?.first_name} {request.users?.last_name}
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {request.users?.email} • {request.users?.phone}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        سبب طلب الحذف:
                      </p>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        {request.reason}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-700 dark:text-gray-300">
                      <span>تاريخ الطلب: {new Date(request.requested_at).toLocaleDateString('ar-EG')}</span>
                      <span>•</span>
                      <span>نوع المستخدم: {request.user_type === 'client' ? 'عميل' : 'محامي'}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setAdminNotes('');
                        setError('');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      مراجعة
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-start space-x-3 space-x-reverse mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  مراجعة طلب الحذف
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedRequest.users?.first_name} {selectedRequest.users?.last_name}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ملاحظات الإدارة <span className="text-red-500">*</span>
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="اكتب ملاحظاتك هنا..."
              />
            </div>

            <div className="flex space-x-3 space-x-reverse">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setAdminNotes('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleReject(selectedRequest.request_id)}
                disabled={processing || !adminNotes.trim()}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'جاري...' : 'رفض'}
              </button>
              <button
                onClick={() => handleApprove(selectedRequest.request_id)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'جاري...' : 'موافقة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeletionRequests;
