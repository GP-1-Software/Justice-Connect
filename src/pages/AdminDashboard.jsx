import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import { Users, CheckCircle, XCircle, Clock, Mail, Phone, MapPin, CreditCard, User, Briefcase, AlertCircle, Shield, Crown, ArrowUp, Trash2, BarChart3 } from 'lucide-react';
import { getPendingDeletionRequests, updateDeletionRequestStatus } from '../services/deletionRequestApi';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState('users'); // 'users', 'lawyers', 'admins', 'super_admins', 'deletion_requests'
  const [userStatusTab, setUserStatusTab] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [displayData, setDisplayData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState(null);
  
  // Deletion requests state
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }
    
    const userData = JSON.parse(user);
    if (!userData.role || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
      navigate('/');
      return;
    }
    
    setCurrentAdmin(userData);
    fetchData();
    
    // Fetch deletion requests if on that tab
    if (mainTab === 'deletion_requests') {
      fetchDeletionRequests();
    }
  }, [navigate, mainTab, userStatusTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (mainTab === 'users' || mainTab === 'lawyers') {
        const table = mainTab === 'users' ? 'users' : 'lawyers';

        // Fetch filtered list
        const listPromise = supabase
          .from(table)
          .select('*')
          .eq('account_status', userStatusTab)
          .order('created_at', { ascending: false });

        // Fetch counts for all statuses in parallel
        const countPending = supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('account_status', 'pending');
        const countApproved = supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('account_status', 'approved');
        const countRejected = supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('account_status', 'rejected');

        const [listRes, pendRes, apprRes, rejRes] = await Promise.all([
          listPromise,
          countPending,
          countApproved,
          countRejected
        ]);

        if (listRes.error) throw listRes.error;
        if (pendRes.error) throw pendRes.error;
        if (apprRes.error) throw apprRes.error;
        if (rejRes.error) throw rejRes.error;

        setDisplayData(listRes.data || []);
        setStatusCounts({
          pending: pendRes.count || 0,
          approved: apprRes.count || 0,
          rejected: rejRes.count || 0
        });
      } else if (mainTab === 'admins') {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .eq('role', 'admin')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDisplayData(data || []);
      } else if (mainTab === 'super_admins') {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .eq('role', 'super_admin')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDisplayData(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      let table = 'users';
      let idColumn = 'user_id';
      if (mainTab === 'lawyers') {
        table = 'lawyers';
        idColumn = 'lawyer_id';
      }

      const { error } = await supabase
        .from(table)
        .update({ account_status: 'approved' })
        .eq(idColumn, userId);

      if (error) throw error;
      
      alert('تم قبول المستخدم بنجاح!');
      fetchData();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('حدث خطأ أثناء قبول المستخدم');
    }
  };

  const handleReject = async (userId) => {
    if (!rejectionReason.trim()) {
      alert('يرجى إدخال سبب الرفض');
      return;
    }

    try {
      let table = 'users';
      let idColumn = 'user_id';
      if (mainTab === 'lawyers') {
        table = 'lawyers';
        idColumn = 'lawyer_id';
      }

      const { error } = await supabase
        .from(table)
        .update({ 
          account_status: 'rejected',
          rejection_reason: rejectionReason 
        })
        .eq(idColumn, userId);

      if (error) throw error;
      
      alert('تم رفض المستخدم');
      setSelectedUser(null);
      setRejectionReason('');
      fetchData();
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('حدث خطأ أثناء رفض المستخدم');
    }
  };

  const handlePromoteToAdmin = async (user) => {
    if (!window.confirm(`هل أنت متأكد من ترقية ${user.first_name} ${user.last_name} إلى مسؤول؟`)) {
      return;
    }

    try {
      // Insert into admins table
      const { error: insertError } = await supabase
        .from('admins')
        .insert([{
          id_number: user.id_number,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          city: user.city,
          password_hash: user.password_hash,
          role: 'admin'
        }]);

      if (insertError) throw insertError;

      // Delete from users table
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('user_id', user.user_id);

      if (deleteError) throw deleteError;

      alert('تم ترقية المستخدم إلى مسؤول بنجاح!');
      fetchData();
    } catch (error) {
      console.error('Error promoting user:', error);
      alert('حدث خطأ أثناء ترقية المستخدم');
    }
  };

  const handleDemoteAdmin = async (admin) => {
    if (!window.confirm(`هل أنت متأكد من تخفيض رتبة ${admin.first_name} ${admin.last_name} إلى مستخدم عادي؟`)) {
      return;
    }

    try {
      // Insert into users table
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id_number: admin.id_number,
          first_name: admin.first_name,
          last_name: admin.last_name,
          email: admin.email,
          phone: admin.phone,
          city: admin.city,
          password_hash: admin.password_hash,
          user_type: 'client',
          account_status: 'approved'
        }]);

      if (insertError) throw insertError;

      // Delete from admins table
      const { error: deleteError } = await supabase
        .from('admins')
        .delete()
        .eq('admin_id', admin.admin_id);

      if (deleteError) throw deleteError;

      alert('تم تخفيض رتبة المسؤول إلى مستخدم عادي بنجاح!');
      fetchData();
    } catch (error) {
      console.error('Error demoting admin:', error);
      alert('حدث خطأ أثناء تخفيض الرتبة');
    }
  };

  // Deletion requests functions
  const fetchDeletionRequests = async () => {
    setLoading(true);
    try {
      const result = await getPendingDeletionRequests();
      if (result.success) {
        setDeletionRequests(result.data || []);
      } else {
        alert('فشل تحميل طلبات الحذف');
      }
    } catch (error) {
      console.error('Error fetching deletion requests:', error);
      alert('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDeletion = async (requestId) => {
    if (!window.confirm('هل أنت متأكد من الموافقة على حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    setProcessing(true);
    try {
      const result = await updateDeletionRequestStatus(
        requestId,
        'approved',
        currentAdmin.admin_id,
        adminNotes || 'تمت الموافقة على حذف الحساب'
      );

      if (result.success) {
        alert('تمت الموافقة على حذف الحساب بنجاح');
        setSelectedRequest(null);
        setAdminNotes('');
        fetchDeletionRequests();
      } else {
        alert(result.error || 'فشل الموافقة على الطلب');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('حدث خطأ في الموافقة على الطلب');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectDeletion = async (requestId) => {
    if (!adminNotes.trim()) {
      alert('يرجى كتابة سبب الرفض');
      return;
    }

    setProcessing(true);
    try {
      const result = await updateDeletionRequestStatus(
        requestId,
        'rejected',
        currentAdmin.admin_id,
        adminNotes
      );

      if (result.success) {
        alert('تم رفض الطلب بنجاح');
        setSelectedRequest(null);
        setAdminNotes('');
        fetchDeletionRequests();
      } else {
        alert(result.error || 'فشل رفض الطلب');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('حدث خطأ في رفض الطلب');
    } finally {
      setProcessing(false);
    }
  };

  const UserCard = ({ user }) => {
    // Determine user type display
    const getUserTypeDisplay = () => {
      if (user.role === 'super_admin') {
        return { label: 'Super Admin', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Crown };
      } else if (user.role === 'admin') {
        return { label: 'مسؤول', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Shield };
      } else if (user.user_type === 'lawyer') {
        return { label: 'محامي', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Briefcase };
      } else {
        return { label: 'عميل', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: User };
      }
    };

    const userType = getUserTypeDisplay();
    const IconComponent = userType.icon;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.first_name} {user.last_name}
              </h3>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${userType.color}`}>
                {userType.label}
              </span>
            </div>
          </div>
        </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-300">
          <Mail className="h-4 w-4" />
          <span className="text-sm">{user.email}</span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-300">
          <Phone className="h-4 w-4" />
          <span className="text-sm">{user.phone}</span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-300">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{user.city}</span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-300">
          <CreditCard className="h-4 w-4" />
          <span className="text-sm">{user.id_number}</span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span className="text-xs">
            تاريخ التسجيل: {new Date(user.created_at).toLocaleDateString('ar-EG')}
          </span>
        </div>
      </div>

      {(mainTab === 'users' || mainTab === 'lawyers') && userStatusTab === 'pending' && (
        <div className="flex space-x-3 space-x-reverse">
          <button
            onClick={() => handleApprove(user.user_id || user.lawyer_id)}
            className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            <CheckCircle className="h-5 w-5" />
            <span>قبول</span>
          </button>
          <button
            onClick={() => setSelectedUser(user)}
            className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
          >
            <XCircle className="h-5 w-5" />
            <span>رفض</span>
          </button>
        </div>
      )}

      {(mainTab === 'users' || mainTab === 'lawyers') && userStatusTab === 'approved' && (
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-semibold">
            <CheckCircle className="h-5 w-5" />
            <span>مقبول</span>
          </div>
          {currentAdmin?.role === 'super_admin' && (
            <button
              onClick={() => handlePromoteToAdmin(user)}
              className="w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              <ArrowUp className="h-5 w-5" />
              <span>ترقية إلى مسؤول</span>
            </button>
          )}
        </div>
      )}

      {(mainTab === 'users' || mainTab === 'lawyers') && userStatusTab === 'rejected' && (
        <div className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-semibold">
          <XCircle className="h-5 w-5" />
          <span>مرفوض</span>
        </div>
      )}

      {/* Admin/Super Admin Actions */}
      {(mainTab === 'admins' || mainTab === 'super_admins') && currentAdmin?.role === 'super_admin' && user.role !== 'super_admin' && (
        <button
          onClick={() => handleDemoteAdmin(user)}
          className="w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold"
        >
          <ArrowUp className="h-5 w-5 rotate-180" />
          <span>تخفيض إلى مستخدم</span>
        </button>
      )}
    </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20 px-4 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              لوحة تحكم المسؤول
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              إدارة طلبات الانضمام والمستخدمين المقبولين
            </p>
          </div>

          {/* Main Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-2 mb-8">
            <div className={`grid gap-2 ${currentAdmin?.role === 'super_admin' ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <button
                onClick={() => { setMainTab('users'); setUserStatusTab('pending'); }}
                className={`flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition ${
                  mainTab === 'users'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>المستخدمين</span>
              </button>
              <button
                onClick={() => { setMainTab('lawyers'); setUserStatusTab('pending'); }}
                className={`flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition ${
                  mainTab === 'lawyers'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Briefcase className="h-5 w-5" />
                <span>المحاميين</span>
              </button>
              <button
                onClick={() => { setMainTab('admins'); setUserStatusTab('pending'); }}
                className={`flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition ${
                  mainTab === 'admins'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Shield className="h-5 w-5" />
                <span>المسؤولين</span>
              </button>
              {currentAdmin?.role === 'super_admin' && (
                <button
                onClick={() => { setMainTab('super_admins'); setUserStatusTab('pending'); }}
                  className={`flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition ${
                    mainTab === 'super_admins'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Crown className="h-5 w-5" />
                  <span>Super Admin</span>
                </button>
              )}
              <button
                onClick={() => setMainTab('deletion_requests')}
                className={`flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition ${
                  mainTab === 'deletion_requests'
                    ? 'bg-gradient-to-r from-red-600 to-pink-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Trash2 className="h-5 w-5" />
                <span>طلبات الحذف</span>
              </button>
              <Link
                to="/admin/system-ai"
                className="flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-500 hover:text-white hover:shadow-lg"
              >
                <BarChart3 className="h-5 w-5" />
                <span>SystemAI</span>
              </Link>
            </div>
          </div>


          {/* Statistics */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {(mainTab === 'users' || mainTab === 'lawyers') && (
              <>
                <button
                  onClick={() => setUserStatusTab('pending')}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all hover:shadow-xl cursor-pointer ${
                    userStatusTab === 'pending' ? 'ring-4 ring-yellow-500 ring-opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                      <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">في الانتظار</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.pending}</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setUserStatusTab('approved')}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all hover:shadow-xl cursor-pointer ${
                    userStatusTab === 'approved' ? 'ring-4 ring-green-500 ring-opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">مقبول</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.approved}</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setUserStatusTab('rejected')}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all hover:shadow-xl cursor-pointer ${
                    userStatusTab === 'rejected' ? 'ring-4 ring-red-500 ring-opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                      <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">مرفوض</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.rejected}</p>
                    </div>
                  </div>
                </button>
              </>
            )}
            
            {mainTab === 'admins' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">عدد المسؤولين</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {displayData.length}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {mainTab === 'super_admins' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                    <Crown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">عدد Super Admins</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {displayData.length}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {mainTab === 'deletion_requests' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">طلبات الحذف المعلقة</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {deletionRequests.length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Data Grid */}
          {mainTab === 'deletion_requests' ? (
            // Deletion Requests Content
            loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">جاري التحميل...</p>
              </div>
            ) : deletionRequests.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  لا توجد طلبات حذف
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  لا توجد طلبات حذف حسابات معلقة حالياً
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {deletionRequests.map((request) => (
                  <div
                    key={request.request_id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 space-x-reverse mb-3">
                          <div className="text-yellow-600 dark:text-yellow-400">
                            <Clock className="w-5 h-5" />
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
                          <span>تاريخ الطلب: {new Date(request.requested_at).toLocaleDateString('ar-SA')}</span>
                          <span>•</span>
                          <span>نوع المستخدم: {request.user_type === 'client' ? 'عميل' : 'محامي'}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setAdminNotes('');
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
            )
          ) : loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">جاري التحميل...</p>
            </div>
          ) : displayData.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600 dark:text-gray-300">
                لا توجد بيانات لعرضها
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayData.map((item) => (
                <UserCard key={item.user_id || item.lawyer_id || item.admin_id} user={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              رفض طلب الانضمام
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              المستخدم: <span className="font-semibold">{selectedUser.first_name} {selectedUser.last_name}</span>
            </p>
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
              سبب الرفض
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="اكتب سبب رفض الطلب..."
              rows="4"
              required
            />
            <div className="flex space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => handleReject(selectedUser.user_id || selectedUser.lawyer_id)}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold"
              >
                تأكيد الرفض
              </button>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-500 transition font-semibold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Request Review Modal */}
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
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleRejectDeletion(selectedRequest.request_id)}
                disabled={processing || !adminNotes.trim()}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'جاري...' : 'رفض'}
              </button>
              <button
                onClick={() => handleApproveDeletion(selectedRequest.request_id)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'جاري...' : 'موافقة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
