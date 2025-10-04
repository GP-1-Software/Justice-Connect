import React, { useState } from 'react';
import { Scale, CheckCircle, XCircle, Eye, User, Briefcase, CreditCard, Mail, Phone, MapPin, AlertCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminVerification = () => {
  // Mock data - In real app, this would come from backend
  const [pendingUsers, setPendingUsers] = useState([
    {
      id: 1,
      type: 'client',
      firstName: 'أحمد',
      lastName: 'محمود',
      email: 'ahmad@example.com',
      phone: '+970 599 123 456',
      city: 'نابلس',
      idNumber: '40-960-4733',
      idCardPhoto: 'https://via.placeholder.com/400x250?text=ID+Card+Photo',
      status: 'pending',
      submittedAt: '2025-10-04 10:30',
    },
    {
      id: 2,
      type: 'lawyer',
      firstName: 'سارة',
      lastName: 'أحمد',
      email: 'sara@example.com',
      phone: '+970 599 987 654',
      city: 'رام الله',
      idNumber: '95-123-4567',
      idCardPhoto: 'https://via.placeholder.com/400x250?text=ID+Card+Photo',
      certificate: 'lawyer_certificate.pdf',
      status: 'pending',
      submittedAt: '2025-10-04 11:15',
    },
  ]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleApprove = (userId) => {
    setPendingUsers(pendingUsers.map(user => 
      user.id === userId ? { ...user, status: 'approved' } : user
    ));
    setShowModal(false);
    alert('تم الموافقة على الحساب بنجاح!\nسيتم إرسال بريد إلكتروني للمستخدم.');
  };

  const handleReject = (userId) => {
    const reason = prompt('يرجى إدخال سبب الرفض:');
    if (reason) {
      setPendingUsers(pendingUsers.map(user => 
        user.id === userId ? { ...user, status: 'rejected', rejectionReason: reason } : user
      ));
      setShowModal(false);
      alert('تم رفض الحساب.\nسيتم إرسال بريد إلكتروني للمستخدم مع سبب الرفض.');
    }
  };

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const pendingCount = pendingUsers.filter(u => u.status === 'pending').length;
  const approvedCount = pendingUsers.filter(u => u.status === 'approved').length;
  const rejectedCount = pendingUsers.filter(u => u.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 space-x-reverse mb-6 hover:opacity-80 transition">
            <Scale className="h-10 w-10 text-blue-600 dark:text-white" />
            <span className="text-3xl font-bold gradient-text">لوحة التحكم - التحقق من الهوية</span>
          </Link>
          <p className="text-gray-600 dark:text-gray-300">مراجعة والموافقة على طلبات إنشاء الحسابات</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-200 dark:border-yellow-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 dark:text-yellow-400 text-sm font-semibold mb-1">قيد المراجعة</p>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{pendingCount}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-semibold mb-1">تمت الموافقة</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">{approvedCount}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 dark:text-red-400 text-sm font-semibold mb-1">مرفوضة</p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">{rejectedCount}</p>
              </div>
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Pending Users List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">طلبات قيد المراجعة</h2>
          
          {pendingUsers.filter(u => u.status === 'pending').length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">لا توجد طلبات قيد المراجعة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.filter(u => u.status === 'pending').map(user => (
                <div key={user.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 space-x-reverse flex-1">
                      <div className={`p-3 rounded-full ${user.type === 'lawyer' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'}`}>
                        {user.type === 'lawyer' ? (
                          <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 space-x-reverse mb-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.type === 'lawyer' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          }`}>
                            {user.type === 'lawyer' ? 'محامي' : 'عميل'}
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Phone className="h-4 w-4" />
                            <span>{user.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <MapPin className="h-4 w-4" />
                            <span>{user.city}</span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          تم الإرسال: {user.submittedAt}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => openUserDetails(user)}
                      className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      <Eye className="h-4 w-4" />
                      <span>مراجعة</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Details Modal */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    تفاصيل الطلب - {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                {/* User Info */}
                <div className="space-y-4 mb-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">الاسم الكامل</label>
                      <p className="text-gray-900 dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">نوع الحساب</label>
                      <p className="text-gray-900 dark:text-white">{selectedUser.type === 'lawyer' ? 'محامي' : 'عميل'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">البريد الإلكتروني</label>
                      <p className="text-gray-900 dark:text-white">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">رقم الهاتف</label>
                      <p className="text-gray-900 dark:text-white">{selectedUser.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">المدينة</label>
                      <p className="text-gray-900 dark:text-white">{selectedUser.city}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">رقم الهوية</label>
                      <p className="text-gray-900 dark:text-white font-mono">{selectedUser.idNumber}</p>
                    </div>
                  </div>
                </div>

                {/* ID Card Photo */}
                <div className="mb-6">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">صورة بطاقة الهوية</label>
                  <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900">
                    <img 
                      src={selectedUser.idCardPhoto} 
                      alt="ID Card" 
                      className="w-full h-64 object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Certificate for Lawyers */}
                {selectedUser.type === 'lawyer' && selectedUser.certificate && (
                  <div className="mb-6">
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">شهادة المحاماة</label>
                    <div className="flex items-center space-x-3 space-x-reverse p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl">
                      <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      <span className="text-blue-700 dark:text-blue-300 font-semibold">{selectedUser.certificate}</span>
                      <button className="mr-auto text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm underline">
                        عرض الملف
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleApprove(selectedUser.id)}
                    className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>الموافقة على الحساب</span>
                  </button>
                  <button
                    onClick={() => handleReject(selectedUser.id)}
                    className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>رفض الحساب</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerification;
