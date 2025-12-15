import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import { Users, CheckCircle, XCircle, Clock, Mail, Phone, MapPin, CreditCard, User, Briefcase, AlertCircle, Shield, Crown, ArrowUp, Trash2, BarChart3, MessageSquare, FileText, Calendar, UserPlus } from 'lucide-react';
import { getPendingDeletionRequests, updateDeletionRequestStatus } from '../services/deletionRequestApi';
import { getAllTicketsForAdmin, updateTicketStatus, addReplyToTicket } from '../services/supportApi';
import { notifyDeletionRequestApproved, notifyDeletionRequestRejected } from '../services/notificationService';
import { toast } from 'react-hot-toast';

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

  // Support tickets state
  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTicketUser, setSelectedTicketUser] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Role Assignment State
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [assignRoleData, setAssignRoleData] = useState({ idNumber: '', role: 'lawyer' });

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!assignRoleData.idNumber) {
      toast.error('يرجى إدخال رقم الهوية');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_id_number: assignRoleData.idNumber,
          new_role: assignRoleData.role
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('تم تعيين الدور بنجاح');
        setShowAssignRoleModal(false);
        setAssignRoleData({ idNumber: '', role: 'lawyer' });
        fetchData();
      } else {
        toast.error(data.error || 'فشل تعيين الدور');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('حدث خطأ أثناء تعيين الدور');
    }
  };

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
    } else if (mainTab === 'support_tickets') {
      fetchSupportTickets();
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

  // Support tickets functions
  const fetchSupportTickets = async () => {
    setLoading(true);
    try {
      const data = await getAllTicketsForAdmin();
      setSupportTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      alert('حدث خطأ في تحميل التذاكر');
    } finally {
      setLoading(false);
    }
  };

  // Realtime subscription for support tickets
  useEffect(() => {
    if (mainTab !== 'support_tickets') return;

    const channel = supabase
      .channel('support_tickets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        (payload) => {
          console.log('Support ticket changed:', payload);
          fetchSupportTickets();

          // Update selected ticket if it's open
          if (selectedTicket && payload.new && payload.new.ticket_id === selectedTicket.ticket_id) {
            setSelectedTicket(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mainTab, selectedTicket]);

  const handleReplyTicket = async (ticketId) => {
    if (!replyText.trim()) {
      toast.error('يرجى كتابة الرد');
      return;
    }

    setProcessing(true);
    try {
      const adminName = `${currentAdmin.first_name} ${currentAdmin.last_name}`;
      await addReplyToTicket(ticketId, 'admin', currentAdmin.admin_id, adminName, replyText);
      toast.success('تم إرسال الرد بنجاح! ✅');
      setReplyText('');
      fetchSupportTickets();
    } catch (error) {
      console.error('Error replying to ticket:', error);
      toast.error('حدث خطأ أثناء الرد على التذكرة');
    } finally {
      setProcessing(false);
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
        // Send notification to the user
        const userId = selectedRequest.user_id || selectedRequest.lawyer_id;
        const userType = selectedRequest.user_type;
        await notifyDeletionRequestApproved(userId, userType);

        toast.success('تمت الموافقة على حذف الحساب بنجاح');
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
        // Send notification to the user with rejection reason
        const userId = selectedRequest.user_id || selectedRequest.lawyer_id;
        const userType = selectedRequest.user_type;
        await notifyDeletionRequestRejected(userId, userType, adminNotes);

        toast.success('تم رفض الطلب بنجاح');
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

      {/* Assign Role Modal */}
      {showAssignRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">تعيين دور جديد لمستخدم</h2>
            <form onSubmit={handleAssignRole} className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">رقم الهوية</label>
                <input
                  type="text"
                  value={assignRoleData.idNumber}
                  onChange={(e) => setAssignRoleData({ ...assignRoleData, idNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="أدخل رقم الهوية"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">الدور الجديد</label>
                <select
                  value={assignRoleData.role}
                  onChange={(e) => setAssignRoleData({ ...assignRoleData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="lawyer">محامي</option>
                  <option value="client">عميل</option>
                  <option value="admin">مسؤول</option>
                  {currentAdmin?.role === 'super_admin' && <option value="super_admin">مسؤول عام</option>}
                </select>
              </div>
              <div className="flex space-x-3 space-x-reverse pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  تعيين
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignRoleModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Navbar />
      <div className="h-[calc(100vh-4rem)] mt-16 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                لوحة تحكم المسؤول
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                إدارة طلبات الانضمام والمستخدمين المقبولين
              </p>
            </div>
            <button
              onClick={() => setShowAssignRoleModal(true)}
              className="flex items-center justify-center space-x-2 space-x-reverse px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:shadow-lg transition transform hover:scale-105 font-bold"
            >
              <UserPlus className="h-5 w-5" />
              <span>تعيين دور جديد</span>
            </button>
          </div>

          {/* Main Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-2 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
              <button
                onClick={() => { setMainTab('users'); setUserStatusTab('pending'); }}
                className={`flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition ${mainTab === 'users'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <Users className="h-5 w-5" />
                <span>المستخدمين</span>
              </button>
              <button
                onClick={() => { setMainTab('lawyers'); setUserStatusTab('pending'); }}
                className={`flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition ${mainTab === 'lawyers'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <Briefcase className="h-5 w-5" />
                <span>المحاميين</span>
              </button>
              <button
                onClick={() => { setMainTab('admins'); setUserStatusTab('pending'); }}
                className={`flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition ${mainTab === 'admins'
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
                  className={`flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition ${mainTab === 'super_admins'
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
                className={`flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition ${mainTab === 'deletion_requests'
                  ? 'bg-gradient-to-r from-red-600 to-pink-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <Trash2 className="h-5 w-5" />
                <span>طلبات الحذف</span>
              </button>
              <button
                onClick={() => setMainTab('support_tickets')}
                className={`flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition ${mainTab === 'support_tickets'
                  ? 'bg-gradient-to-r from-green-600 to-teal-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <MessageSquare className="h-5 w-5" />
                <span>الدعم الفني</span>
              </button>
              <Link
                to="/admin/analytics"
                className="flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-500 hover:text-white hover:shadow-lg"
              >
                <BarChart3 className="h-5 w-5" />
                <span>الإحصائيات</span>
              </Link>
              <Link
                to="/admin/cases"
                className="flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-500 hover:text-white hover:shadow-lg"
              >
                <FileText className="h-5 w-5" />
                <span>إدارة القضايا</span>
              </Link>
              <Link
                to="/admin/appointments"
                className="flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-green-600 hover:to-teal-500 hover:text-white hover:shadow-lg"
              >
                <Calendar className="h-5 w-5" />
                <span>المواعيد</span>
              </Link>
              <Link
                to="/admin/payments"
                className="flex items-center justify-center space-x-2 space-x-reverse py-3 rounded-xl font-semibold transition text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-emerald-600 hover:to-green-500 hover:text-white hover:shadow-lg"
              >
                <CreditCard className="h-5 w-5" />
                <span>المدفوعات</span>
              </Link>
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
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all hover:shadow-xl cursor-pointer ${userStatusTab === 'pending' ? 'ring-4 ring-yellow-500 ring-opacity-50' : ''
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
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all hover:shadow-xl cursor-pointer ${userStatusTab === 'approved' ? 'ring-4 ring-green-500 ring-opacity-50' : ''
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
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all hover:shadow-xl cursor-pointer ${userStatusTab === 'rejected' ? 'ring-4 ring-red-500 ring-opacity-50' : ''
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

            {mainTab === 'support_tickets' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">تذاكر الدعم الفني</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {supportTickets.length}
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
          ) : mainTab === 'support_tickets' ? (
            // Support Tickets Content
            loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">جاري التحميل...</p>
              </div>
            ) : supportTickets.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 dark:text-gray-300">لا توجد تذاكر دعم فني</p>
              </div>
            ) : (
              <div className="space-y-4">
                {supportTickets.map((ticket) => (
                  <div key={ticket.ticket_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-3 space-x-reverse mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{ticket.subject}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                            ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {ticket.status === 'open' ? 'مفتوحة' : ticket.status === 'resolved' ? 'تم الحل' : ticket.status}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                            {ticket.priority === 'high' ? 'عالية' : ticket.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">{ticket.description}</p>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4">
                          <span>{ticket.submitter_type === 'client' ? 'عميل' : 'محامي'}</span>
                          <button
                            onClick={() => setSelectedTicketUser(ticket.submitter_type === 'client' ? ticket.users : ticket.lawyers)}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {ticket.submitter_type === 'client'
                              ? `${ticket.users?.first_name} ${ticket.users?.last_name}`
                              : `${ticket.lawyers?.first_name} ${ticket.lawyers?.last_name}`
                            }
                          </button>
                          <span>{new Date(ticket.created_at).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setReplyText('');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        عرض / رد
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Default Content (Users, Lawyers, Admins)
            loading ? (
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
            )
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

      {/* Support Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTicket.subject}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedTicket.submitter_type === 'client'
                    ? `${selectedTicket.users?.first_name} ${selectedTicket.users?.last_name}`
                    : `${selectedTicket.lawyers?.first_name} ${selectedTicket.lawyers?.last_name}`}
                </p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Conversation Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Original Message */}
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {selectedTicket.submitter_type === 'client'
                          ? `${selectedTicket.users?.first_name} ${selectedTicket.users?.last_name}`
                          : `${selectedTicket.lawyers?.first_name} ${selectedTicket.lawyers?.last_name}`}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(selectedTicket.created_at).toLocaleString('ar-EG')}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {selectedTicket.replies && selectedTicket.replies.length > 0 && selectedTicket.replies.map((reply, index) => (
                <div key={index} className={`flex gap-3 ${reply.sender_type === 'admin' ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reply.sender_type === 'admin'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                      {reply.sender_type === 'admin' ? (
                        <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className={`rounded-lg p-4 ${reply.sender_type === 'admin'
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-blue-50 dark:bg-blue-900/20'
                      }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">
                          {reply.sender_name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${reply.sender_type === 'admin'
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                          : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                          }`}>
                          {reply.sender_type === 'admin' ? 'إدارة' : reply.sender_type === 'client' ? 'عميل' : 'محامي'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(reply.created_at).toLocaleString('ar-EG')}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">رد جديد</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="اكتب ردك هنا..."
                rows="3"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                >
                  إغلاق
                </button>
                <button
                  onClick={() => handleReplyTicket(selectedTicket.ticket_id)}
                  disabled={processing || !replyText.trim()}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'جاري الإرسال...' : 'إرسال الرد'}
                </button>
              </div>
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

      {/* User Profile Modal */}
      {selectedTicketUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                بيانات المستخدم
              </h3>
              <button
                onClick={() => setSelectedTicketUser(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">الاسم الكامل</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedTicketUser.first_name} {selectedTicketUser.last_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">البريد الإلكتروني</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedTicketUser.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Phone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">رقم الهاتف</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedTicketUser.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">المدينة</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedTicketUser.city || 'غير محدد'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <CreditCard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">رقم الهوية</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedTicketUser.id_number || 'غير محدد'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => setSelectedTicketUser(null)}
                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition font-semibold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
