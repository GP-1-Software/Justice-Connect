import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import { Users, CheckCircle, XCircle, Clock, Mail, Phone, MapPin, CreditCard, User, Briefcase, AlertCircle, Shield, Crown, ArrowUp, Trash2, BarChart3, MessageSquare, FileText, Calendar, UserPlus, Scale, Building2, Plus, Edit, X, Search } from 'lucide-react';
import { getPendingDeletionRequests, updateDeletionRequestStatus } from '../services/deletionRequestApi';
import { getAllTicketsForAdmin, updateTicketStatus, addReplyToTicket } from '../services/supportApi';
import { notifyDeletionRequestApproved, notifyDeletionRequestRejected } from '../services/notificationService';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState('users'); // 'users', 'lawyers', 'admins', 'super_admins', 'deletion_requests', 'court_clerks', 'courts'
  const [userStatusTab, setUserStatusTab] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [displayData, setDisplayData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, approved: 0, rejected: 0, banned: 0 });
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

  // Court Clerks state
  const [courtClerks, setCourtClerks] = useState([]);
  const [courts, setCourts] = useState([]);
  const [showAddClerkModal, setShowAddClerkModal] = useState(false);
  const [showAddCourtModal, setShowAddCourtModal] = useState(false);
  const [showEditCourtModal, setShowEditCourtModal] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [newClerkData, setNewClerkData] = useState({ idNumber: '', courtId: '' });
  const [newCourtData, setNewCourtData] = useState({ court_name: '', court_type: '', city: '', is_active: true });
  const [approvedUsers, setApprovedUsers] = useState([]);

  // Ban/Suspend State
  const [showBanModal, setShowBanModal] = useState(false);
  const [userToBan, setUserToBan] = useState(null);
  const [banReason, setBanReason] = useState('');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!assignRoleData.idNumber) {
      toast.error('يرجى إدخال رقم الهوية');
      return;
    }

    try {
      const response = await fetch('https://justice-connect-mobile.onrender.com/api/auth/assign-role', {
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
    console.log('🔍 Current Admin:', userData); // Debug
    console.log('🔍 Admin Role:', userData.role); // Debug
    fetchData();

    // Fetch deletion requests if on that tab
    if (mainTab === 'deletion_requests') {
      fetchDeletionRequests();
    } else if (mainTab === 'support_tickets') {
      fetchSupportTickets();
    } else if (mainTab === 'court_clerks') {
      fetchCourtClerks();
      fetchCourts();
      fetchApprovedUsers();
    } else if (mainTab === 'courts') {
      fetchCourts();
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
        const countBanned = supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('account_status', 'banned');

        const [listRes, pendRes, apprRes, rejRes, banRes] = await Promise.all([
          listPromise,
          countPending,
          countApproved,
          countRejected,
          countBanned
        ]);

        if (listRes.error) throw listRes.error;
        if (pendRes.error) throw pendRes.error;
        if (apprRes.error) throw apprRes.error;
        if (rejRes.error) throw rejRes.error;
        if (banRes.error) throw banRes.error;

        setDisplayData(listRes.data || []);
        setStatusCounts({
          pending: pendRes.count || 0,
          approved: apprRes.count || 0,
          rejected: rejRes.count || 0,
          banned: banRes.count || 0
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

  // Court Clerks Functions
  const fetchCourtClerks = async () => {
    try {
      const { data, error } = await supabase
        .from('court_clerks')
        .select(`
          *,
          users:user_id (user_id, first_name, last_name, email, phone, id_number),
          courts:court_id (court_id, court_name, court_type, city)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourtClerks(data || []);
    } catch (error) {
      console.error('Error fetching court clerks:', error);
    }
  };

  const fetchCourts = async () => {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('court_name', { ascending: true });

      if (error) throw error;
      setCourts(data || []);
    } catch (error) {
      console.error('Error fetching courts:', error);
    }
  };

  const fetchApprovedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, first_name, last_name, id_number, email')
        .eq('account_status', 'approved')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setApprovedUsers(data || []);
    } catch (error) {
      console.error('Error fetching approved users:', error);
    }
  };

  const handleAddCourtClerk = async () => {
    if (!newClerkData.idNumber || !newClerkData.courtId) {
      toast.error('يرجى إدخال جميع البيانات المطلوبة');
      return;
    }

    setProcessing(true);
    try {
      // Find user by id_number
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('id_number', newClerkData.idNumber)
        .single();

      if (userError || !userData) {
        toast.error('المستخدم غير موجود');
        setProcessing(false);
        return;
      }

      // Check if already a court clerk
      const { data: existingClerk } = await supabase
        .from('court_clerks')
        .select('clerk_id')
        .eq('user_id', userData.user_id)
        .single();

      if (existingClerk) {
        toast.error('هذا المستخدم مسجل كموظف قلم محكمة بالفعل');
        setProcessing(false);
        return;
      }

      // Insert into court_clerks
      const { error: insertError } = await supabase
        .from('court_clerks')
        .insert({
          user_id: userData.user_id,
          court_id: parseInt(newClerkData.courtId),
          is_active: true
        });

      if (insertError) throw insertError;

      // Add role to user_roles
      await supabase
        .from('user_roles')
        .insert({
          id_number: newClerkData.idNumber,
          role: 'court_clerk'
        });

      // Update user's user_type
      await supabase
        .from('users')
        .update({ user_type: 'court_clerk' })
        .eq('user_id', userData.user_id);

      toast.success('تم إضافة موظف قلم المحكمة بنجاح');
      setShowAddClerkModal(false);
      setNewClerkData({ idNumber: '', courtId: '' });
      fetchCourtClerks();
    } catch (error) {
      console.error('Error adding court clerk:', error);
      toast.error('حدث خطأ أثناء إضافة الموظف');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveCourtClerk = async (clerkId, userId, idNumber) => {
    if (!window.confirm('هل أنت متأكد من إزالة هذا الموظف من قلم المحكمة؟')) {
      return;
    }

    try {
      // Delete from court_clerks
      const { error } = await supabase
        .from('court_clerks')
        .delete()
        .eq('clerk_id', clerkId);

      if (error) throw error;

      // Remove role from user_roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('id_number', idNumber)
        .eq('role', 'court_clerk');

      // Update user's user_type back to client
      await supabase
        .from('users')
        .update({ user_type: 'client' })
        .eq('user_id', userId);

      toast.success('تم إزالة الموظف بنجاح');
      fetchCourtClerks();
    } catch (error) {
      console.error('Error removing court clerk:', error);
      toast.error('حدث خطأ أثناء إزالة الموظف');
    }
  };

  const handleAddCourt = async () => {
    if (!newCourtData.court_name || !newCourtData.court_type || !newCourtData.city) {
      toast.error('يرجى إدخال جميع البيانات المطلوبة');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('courts')
        .insert({
          court_name: newCourtData.court_name,
          court_type: newCourtData.court_type,
          city: newCourtData.city,
          is_active: newCourtData.is_active
        });

      if (error) throw error;

      toast.success('تم إضافة المحكمة بنجاح');
      setShowAddCourtModal(false);
      setNewCourtData({ court_name: '', court_type: '', city: '', is_active: true });
      fetchCourts();
    } catch (error) {
      console.error('Error adding court:', error);
      toast.error('حدث خطأ أثناء إضافة المحكمة');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateCourt = async () => {
    if (!selectedCourt) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('courts')
        .update({
          court_name: newCourtData.court_name,
          court_type: newCourtData.court_type,
          city: newCourtData.city,
          is_active: newCourtData.is_active
        })
        .eq('court_id', selectedCourt.court_id);

      if (error) throw error;

      toast.success('تم تحديث المحكمة بنجاح');
      setShowEditCourtModal(false);
      setSelectedCourt(null);
      setNewCourtData({ court_name: '', court_type: '', city: '', is_active: true });
      fetchCourts();
    } catch (error) {
      console.error('Error updating court:', error);
      toast.error('حدث خطأ أثناء تحديث المحكمة');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleCourtStatus = async (court) => {
    try {
      const { error } = await supabase
        .from('courts')
        .update({ is_active: !court.is_active })
        .eq('court_id', court.court_id);

      if (error) throw error;

      toast.success(court.is_active ? 'تم تعطيل المحكمة' : 'تم تفعيل المحكمة');
      fetchCourts();
    } catch (error) {
      console.error('Error toggling court status:', error);
      toast.error('حدث خطأ');
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

  // Ban User
  const handleBanUser = async () => {
    if (!userToBan) return;

    try {
      setProcessing(true);

      // Determine table and ID column based on tab
      let table, idColumn, userId;
      if (mainTab === 'users') {
        table = 'users';
        idColumn = 'user_id';
        userId = userToBan.user_id;
      } else if (mainTab === 'lawyers') {
        table = 'lawyers';
        idColumn = 'lawyer_id';
        userId = userToBan.lawyer_id;
      } else if (mainTab === 'admins' || mainTab === 'super_admins') {
        table = 'admins';
        idColumn = 'admin_id';
        userId = userToBan.admin_id;
      }

      const { error } = await supabase
        .from(table)
        .update({
          account_status: 'banned',
          ban_reason: banReason || null,
          banned_at: new Date().toISOString()
        })
        .eq(idColumn, userId);

      if (error) throw error;

      toast.success('تم حظر المستخدم بنجاح');
      setShowBanModal(false);
      setUserToBan(null);
      setBanReason('');
      fetchData();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('حدث خطأ أثناء حظر المستخدم');
    } finally {
      setProcessing(false);
    }
  };

  // Unban User
  const handleUnbanUser = async (user) => {
    if (!window.confirm(`هل أنت متأكد من إلغاء حظر ${user.first_name} ${user.last_name}؟`)) {
      return;
    }

    try {
      setProcessing(true);

      // Determine table and ID column based on tab
      let table, idColumn, userId;
      if (mainTab === 'users') {
        table = 'users';
        idColumn = 'user_id';
        userId = user.user_id;
      } else if (mainTab === 'lawyers') {
        table = 'lawyers';
        idColumn = 'lawyer_id';
        userId = user.lawyer_id;
      } else if (mainTab === 'admins' || mainTab === 'super_admins') {
        table = 'admins';
        idColumn = 'admin_id';
        userId = user.admin_id;
      }

      const { error } = await supabase
        .from(table)
        .update({
          account_status: 'approved',
          ban_reason: null,
          banned_at: null
        })
        .eq(idColumn, userId);

      if (error) throw error;

      toast.success('تم إلغاء حظر المستخدم بنجاح');
      fetchData();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('حدث خطأ أثناء إلغاء الحظر');
    } finally {
      setProcessing(false);
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

  // Filter users based on search query
  const filterUsers = (users) => {
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(user => {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const phone = (user.phone || '').toLowerCase();
      const idNumber = (user.id_number || '').toLowerCase();
      const city = (user.city || '').toLowerCase();

      return fullName.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        idNumber.includes(query) ||
        city.includes(query);
    });
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                {user.first_name} {user.last_name}
              </h3>
              <span className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${userType.color}`}>
                {userType.label}
              </span>
            </div>
          </div>
        </div>

        {/* User Info - Compact Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5">
            <Mail className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
            <span className="truncate">{user.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5">
            <Phone className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
            <span className="truncate" dir="ltr">{user.phone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
            <span className="truncate">{user.city}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5">
            <CreditCard className="h-3.5 w-3.5 flex-shrink-0 text-purple-500" />
            <span className="truncate" dir="ltr">{user.id_number}</span>
          </div>
        </div>

        {/* Registration Date */}
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mb-3 justify-center bg-gray-100 dark:bg-gray-700 rounded-lg py-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>تاريخ التسجيل: {new Date(user.created_at).toLocaleDateString('ar-EG')}</span>
        </div>

        {(mainTab === 'users' || mainTab === 'lawyers') && userStatusTab === 'pending' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleApprove(user.user_id || user.lawyer_id)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition font-semibold text-sm shadow-md"
            >
              <CheckCircle className="h-4 w-4" />
              <span>قبول</span>
            </button>
            <button
              onClick={() => setSelectedUser(user)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition font-semibold text-sm shadow-md"
            >
              <XCircle className="h-4 w-4" />
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
            {/* Ban Button */}
            <button
              onClick={() => {
                setUserToBan(user);
                setShowBanModal(true);
              }}
              className="w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition font-semibold"
            >
              <XCircle className="h-5 w-5" />
              <span>حظر</span>
            </button>
          </div>
        )}

        {(mainTab === 'users' || mainTab === 'lawyers') && userStatusTab === 'rejected' && (
          <div className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-semibold">
            <XCircle className="h-5 w-5" />
            <span>مرفوض</span>
          </div>
        )}

        {/* Banned Users */}
        {(mainTab === 'users' || mainTab === 'lawyers') && userStatusTab === 'banned' && (
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-gray-800 dark:bg-gray-900 text-white rounded-lg font-semibold">
              <XCircle className="h-5 w-5" />
              <span>محظور</span>
            </div>
            {user.ban_reason && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                السبب: {user.ban_reason}
              </p>
            )}
            <button
              onClick={() => handleUnbanUser(user)}
              className="w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              <CheckCircle className="h-5 w-5" />
              <span>إلغاء الحظر</span>
            </button>
          </div>
        )}

        {/* Admin/Super Admin Actions */}
        {(mainTab === 'admins' || mainTab === 'super_admins') && currentAdmin?.role === 'super_admin' && user.role !== 'super_admin' && (
          <>
            <button
              onClick={() => handleDemoteAdmin(user)}
              className="w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold"
            >
              <ArrowUp className="h-5 w-5 rotate-180" />
              <span>تخفيض إلى مستخدم</span>
            </button>
            {/* Ban Admin Button */}
            <button
              onClick={() => {
                setUserToBan(user);
                setShowBanModal(true);
              }}
              className="w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition font-semibold mt-2"
            >
              <XCircle className="h-5 w-5" />
              <span>حظر</span>
            </button>
          </>
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
      <div className="h-[calc(100vh-4rem)] mt-16 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-3 sm:px-4 lg:px-6 py-4 sm:py-8 lg:py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                لوحة تحكم المسؤول
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                إدارة طلبات الانضمام والمستخدمين المقبولين
              </p>
            </div>
            {/* Only show for super_admin */}
            {currentAdmin?.role === 'super_admin' && (
              <button
                onClick={() => setShowAssignRoleModal(true)}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:shadow-lg transition transform hover:scale-105 font-bold text-sm sm:text-base"
              >
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">تعيين دور جديد</span>
                <span className="sm:hidden">تعيين</span>
              </button>
            )}
          </div>

          {/* Main Tabs */}
          {/* Mobile: Dropdown Select */}
          <div className="sm:hidden mb-4 space-y-3">
            {/* Styled Dropdown */}
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <select
                value={mainTab}
                onChange={(e) => {
                  const value = e.target.value;
                  // Handle navigation links
                  if (value === 'cases_page') {
                    navigate('/admin/cases');
                    return;
                  }
                  setMainTab(value);
                  if (['users', 'lawyers', 'admins', 'super_admins'].includes(value)) {
                    setUserStatusTab('pending');
                  }
                }}
                className="w-full pl-4 pr-12 py-4 text-base font-bold bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 border-2 border-blue-200 dark:border-blue-800 rounded-2xl shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer text-gray-800 dark:text-white"
              >
                <option value="users">👥 المستخدمين</option>
                <option value="lawyers">💼 المحاميين</option>
                <option value="admins">🛡️ المسؤولين</option>
                {currentAdmin?.role === 'super_admin' && <option value="super_admins">👑 Super Admin</option>}
                <option value="deletion_requests">🗑️ طلبات الحذف</option>
                <option value="support_tickets">💬 الدعم الفني</option>
                <option value="court_clerks">⚖️ قلم المحكمة</option>
                <option value="courts">🏛️ المحاكم</option>
                <option value="cases_page">📋 القضايا</option>
              </select>
            </div>
            {/* Quick Links for mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <Link to="/admin/system-ai" className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-md">
                <BarChart3 className="h-4 w-4" />
                SystemAI
              </Link>
              <Link to="/admin/appointments" className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-md">
                <Calendar className="h-4 w-4" />
                المواعيد
              </Link>
              <Link to="/admin/payments" className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-md">
                <CreditCard className="h-4 w-4" />
                المدفوعات
              </Link>
              <Link to="/admin/analytics" className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-md">
                <BarChart3 className="h-4 w-4" />
                الإحصائيات
              </Link>
            </div>
          </div>

          {/* Desktop/Tablet: Grid Buttons */}
          <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-2 mb-8">
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
              <button
                onClick={() => { setMainTab('users'); setUserStatusTab('pending'); }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition ${mainTab === 'users'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <Users className="h-5 w-5" />
                <span>المستخدمين</span>
              </button>
              <button
                onClick={() => { setMainTab('lawyers'); setUserStatusTab('pending'); }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition ${mainTab === 'lawyers'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <Briefcase className="h-5 w-5" />
                <span>المحاميين</span>
              </button>
              <button
                onClick={() => { setMainTab('admins'); setUserStatusTab('pending'); }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition ${mainTab === 'admins'
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
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition ${mainTab === 'super_admins'
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
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition ${mainTab === 'deletion_requests'
                  ? 'bg-gradient-to-r from-red-600 to-pink-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <Trash2 className="h-5 w-5" />
                <span>طلبات الحذف</span>
              </button>
              <button
                onClick={() => setMainTab('support_tickets')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition ${mainTab === 'support_tickets'
                  ? 'bg-gradient-to-r from-green-600 to-teal-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <MessageSquare className="h-5 w-5" />
                <span>الدعم الفني</span>
              </button>
              <button
                onClick={() => setMainTab('court_clerks')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition ${mainTab === 'court_clerks'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <Scale className="h-5 w-5" />
                <span>قلم المحكمة</span>
              </button>
              <button
                onClick={() => setMainTab('courts')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition ${mainTab === 'courts'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <Building2 className="h-5 w-5" />
                <span>المحاكم</span>
              </button>
              <Link
                to="/admin/analytics"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-500 hover:text-white hover:shadow-lg"
              >
                <BarChart3 className="h-5 w-5" />
                <span>الإحصائيات</span>
              </Link>
              <Link
                to="/admin/cases"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-500 hover:text-white hover:shadow-lg"
              >
                <FileText className="h-5 w-5" />
                <span>إدارة القضايا</span>
              </Link>
              <Link
                to="/admin/appointments"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-green-600 hover:to-teal-500 hover:text-white hover:shadow-lg"
              >
                <Calendar className="h-5 w-5" />
                <span>المواعيد</span>
              </Link>
              <Link
                to="/admin/payments"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-emerald-600 hover:to-green-500 hover:text-white hover:shadow-lg"
              >
                <CreditCard className="h-5 w-5" />
                <span>المدفوعات</span>
              </Link>
              <Link
                to="/admin/system-ai"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition text-gray-600 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-500 hover:text-white hover:shadow-lg"
              >
                <BarChart3 className="h-5 w-5" />
                <span>SystemAI</span>
              </Link>
            </div>
          </div>


          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
            {(mainTab === 'users' || mainTab === 'lawyers') && (
              <>
                {/* Pending */}
                <button
                  onClick={() => setUserStatusTab('pending')}
                  className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-5 transition-all hover:shadow-xl cursor-pointer ${userStatusTab === 'pending' ? 'ring-2 sm:ring-4 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : ''
                    }`}
                >
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">في الانتظار</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.pending}</p>
                    </div>
                  </div>
                </button>

                {/* Approved */}
                <button
                  onClick={() => setUserStatusTab('approved')}
                  className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-5 transition-all hover:shadow-xl cursor-pointer ${userStatusTab === 'approved' ? 'ring-2 sm:ring-4 ring-green-400 bg-green-50 dark:bg-green-900/20' : ''
                    }`}
                >
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">مقبول</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.approved}</p>
                    </div>
                  </div>
                </button>

                {/* Rejected */}
                <button
                  onClick={() => setUserStatusTab('rejected')}
                  className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-5 transition-all hover:shadow-xl cursor-pointer ${userStatusTab === 'rejected' ? 'ring-2 sm:ring-4 ring-red-400 bg-red-50 dark:bg-red-900/20' : ''
                    }`}
                >
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                      <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">مرفوض</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.rejected}</p>
                    </div>
                  </div>
                </button>

                {/* Banned */}
                <button
                  onClick={() => setUserStatusTab('banned')}
                  className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-5 transition-all hover:shadow-xl cursor-pointer ${userStatusTab === 'banned' ? 'ring-2 sm:ring-4 ring-gray-400 bg-gray-100 dark:bg-gray-700' : ''
                    }`}
                >
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">محظور</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.banned}</p>
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

            {mainTab === 'court_clerks' && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                      <Scale className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">موظفين قلم المحكمة</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {courtClerks.length}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddClerkModal(true)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition flex items-center justify-center space-x-3 space-x-reverse border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-amber-500"
                >
                  <Plus className="h-6 w-6 text-amber-600" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">إضافة موظف جديد</span>
                </button>
              </>
            )}

            {mainTab === 'courts' && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                      <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">عدد المحاكم</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {courts.length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">محاكم نشطة</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {courts.filter(c => c.is_active).length}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddCourtModal(true)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition flex items-center justify-center space-x-3 space-x-reverse border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-500"
                >
                  <Plus className="h-6 w-6 text-indigo-600" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">إضافة محكمة جديدة</span>
                </button>
              </>
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
          ) : mainTab === 'court_clerks' ? (
            // Court Clerks Content
            loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">جاري التحميل...</p>
              </div>
            ) : courtClerks.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <Scale className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  لا يوجد موظفين قلم محكمة
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  قم بإضافة موظف جديد للبدء
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courtClerks.map((clerk) => (
                  <div key={clerk.clerk_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                          <Scale className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {clerk.users?.first_name} {clerk.users?.last_name}
                          </h3>
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            موظف قلم محكمة
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-300">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">{clerk.users?.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-300">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{clerk.users?.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-300">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm font-semibold">{clerk.courts?.court_name || 'غير محدد'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${clerk.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {clerk.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                      <button
                        onClick={() => handleRemoveCourtClerk(clerk.clerk_id, clerk.user_id, clerk.users?.id_number)}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition text-sm font-semibold flex items-center space-x-1 space-x-reverse"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>إزالة</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : mainTab === 'courts' ? (
            // Courts Content
            loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">جاري التحميل...</p>
              </div>
            ) : courts.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  لا توجد محاكم مسجلة
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courts.map((court) => (
                  <div key={court.court_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`p-3 rounded-full ${court.is_active ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          <Building2 className={`h-6 w-6 ${court.is_active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{court.court_name}</h3>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${court.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {court.is_active ? 'نشطة' : 'غير نشطة'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-300">
                        <Scale className="h-4 w-4" />
                        <span className="text-sm">{court.court_type}</span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-300">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{court.city}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleCourtStatus(court)}
                        className={`px-3 py-1 rounded text-sm font-semibold transition ${court.is_active ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                      >
                        {court.is_active ? 'تعطيل' : 'تفعيل'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCourt(court);
                          setNewCourtData({ court_name: court.court_name, court_type: court.court_type, city: court.city, is_active: court.is_active });
                          setShowEditCourtModal(true);
                        }}
                        className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition text-sm font-semibold flex items-center space-x-1 space-x-reverse"
                      >
                        <Edit className="h-4 w-4" />
                        <span>تعديل</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Default User/Lawyer/Admin Grid
            loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">جاري التحميل...</p>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                {(mainTab === 'users' || mainTab === 'lawyers') && displayData.length > 0 && (
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث بالاسم، البريد، الهاتف، رقم الهوية، أو المدينة..."
                        className="w-full pr-12 pl-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                  </div>
                )}

                {filterUsers(displayData).length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                      {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد بيانات لعرضها'}
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterUsers(displayData).map((item) => (
                      <UserCard key={item.user_id || item.lawyer_id || item.admin_id} user={item} />
                    ))}
                  </div>
                )}
              </>
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

      {/* Add Court Clerk Modal */}
      {showAddClerkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                إضافة موظف قلم محكمة
              </h3>
              <button onClick={() => setShowAddClerkModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  رقم الهوية
                </label>
                <input
                  type="text"
                  value={newClerkData.idNumber}
                  onChange={(e) => setNewClerkData({ ...newClerkData, idNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                  placeholder="أدخل رقم هوية المستخدم"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  المحكمة
                </label>
                <select
                  value={newClerkData.courtId}
                  onChange={(e) => setNewClerkData({ ...newClerkData, courtId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                >
                  <option value="">اختر المحكمة</option>
                  {courts.filter(c => c.is_active).map((court) => (
                    <option key={court.court_id} value={court.court_id}>
                      {court.court_name} - {court.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse mt-6">
              <button
                onClick={handleAddCourtClerk}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-yellow-500 text-white rounded-xl hover:shadow-lg transition font-semibold disabled:opacity-50"
              >
                {processing ? 'جاري الإضافة...' : 'إضافة'}
              </button>
              <button
                onClick={() => setShowAddClerkModal(false)}
                className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-500 transition font-semibold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Court Modal */}
      {showAddCourtModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                إضافة محكمة جديدة
              </h3>
              <button onClick={() => setShowAddCourtModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  اسم المحكمة
                </label>
                <input
                  type="text"
                  value={newCourtData.court_name}
                  onChange={(e) => setNewCourtData({ ...newCourtData, court_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="اسم المحكمة"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  نوع المحكمة
                </label>
                <select
                  value={newCourtData.court_type}
                  onChange={(e) => setNewCourtData({ ...newCourtData, court_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                >
                  <option value="">اختر نوع المحكمة</option>
                  <option value="صلح">محكمة صلح</option>
                  <option value="بداية">محكمة بداية</option>
                  <option value="تجارية">محكمة تجارية</option>
                  <option value="عمل">محكمة عمل</option>
                  <option value="إدارية">محكمة إدارية</option>
                  <option value="مستعجلة">محكمة مستعجلة</option>
                  <option value="استئناف">محكمة استئناف</option>
                  <option value="نقض">محكمة نقض (عليا)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  المدينة
                </label>
                <input
                  type="text"
                  value={newCourtData.city}
                  onChange={(e) => setNewCourtData({ ...newCourtData, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="المدينة"
                />
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse mt-6">
              <button
                onClick={handleAddCourt}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-500 text-white rounded-xl hover:shadow-lg transition font-semibold disabled:opacity-50"
              >
                {processing ? 'جاري الإضافة...' : 'إضافة'}
              </button>
              <button
                onClick={() => setShowAddCourtModal(false)}
                className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-500 transition font-semibold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Court Modal */}
      {showEditCourtModal && selectedCourt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                تعديل المحكمة
              </h3>
              <button onClick={() => { setShowEditCourtModal(false); setSelectedCourt(null); }} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  اسم المحكمة
                </label>
                <input
                  type="text"
                  value={newCourtData.court_name}
                  onChange={(e) => setNewCourtData({ ...newCourtData, court_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  نوع المحكمة
                </label>
                <select
                  value={newCourtData.court_type}
                  onChange={(e) => setNewCourtData({ ...newCourtData, court_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                >
                  <option value="صلح">محكمة صلح</option>
                  <option value="بداية">محكمة بداية</option>
                  <option value="تجارية">محكمة تجارية</option>
                  <option value="عمل">محكمة عمل</option>
                  <option value="إدارية">محكمة إدارية</option>
                  <option value="مستعجلة">محكمة مستعجلة</option>
                  <option value="استئناف">محكمة استئناف</option>
                  <option value="نقض">محكمة نقض (عليا)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                  المدينة
                </label>
                <input
                  type="text"
                  value={newCourtData.city}
                  onChange={(e) => setNewCourtData({ ...newCourtData, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newCourtData.is_active}
                  onChange={(e) => setNewCourtData({ ...newCourtData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded text-indigo-600"
                />
                <label htmlFor="is_active" className="text-gray-700 dark:text-gray-300 font-semibold">
                  المحكمة نشطة
                </label>
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse mt-6">
              <button
                onClick={handleUpdateCourt}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-500 text-white rounded-xl hover:shadow-lg transition font-semibold disabled:opacity-50"
              >
                {processing ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
              <button
                onClick={() => { setShowEditCourtModal(false); setSelectedCourt(null); }}
                className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-500 transition font-semibold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {showBanModal && userToBan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <XCircle className="h-6 w-6 text-red-600" />
                تأكيد الحظر
              </h3>
              <button onClick={() => { setShowBanModal(false); setUserToBan(null); setBanReason(''); }} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4">
              <p className="text-gray-700 dark:text-gray-300">
                هل أنت متأكد من حظر المستخدم:
              </p>
              <p className="font-bold text-gray-900 dark:text-white text-lg mt-1">
                {userToBan.first_name} {userToBan.last_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userToBan.email}
              </p>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                سبب الحظر (اختياري)
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                placeholder="اكتب سبب الحظر..."
                rows="3"
              />
            </div>

            <div className="flex space-x-3 space-x-reverse mt-6">
              <button
                onClick={handleBanUser}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="h-5 w-5" />
                {processing ? 'جاري الحظر...' : 'تأكيد الحظر'}
              </button>
              <button
                onClick={() => { setShowBanModal(false); setUserToBan(null); setBanReason(''); }}
                className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-400 dark:hover:bg-gray-500 transition font-semibold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
