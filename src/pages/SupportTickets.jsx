import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupportTickets, createSupportTicket, addReplyToTicket } from '../services/supportApi';
import { MessageSquare, Plus, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';

const SupportTickets = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: 'medium' });
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchTickets(parsedUser);
    }, [navigate]);

    const fetchTickets = async (currentUser) => {
        try {
            const userId = currentUser.user_type === 'client' ? currentUser.user_id : currentUser.lawyer_id;
            const data = await getSupportTickets(currentUser.user_type, userId);
            setTickets(data || []);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast.error('فشل تحميل التذاكر');
        } finally {
            setLoading(false);
        }
    };

    // Realtime subscription for support tickets
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('user_support_tickets')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'support_tickets',
                    filter: user.user_type === 'client'
                        ? `user_id=eq.${user.user_id}`
                        : `lawyer_id=eq.${user.lawyer_id}`
                },
                (payload) => {
                    console.log('Ticket updated:', payload);

                    // Show toast notification for new replies
                    if (payload.eventType === 'UPDATE' && payload.new.replies) {
                        const oldRepliesCount = payload.old?.replies?.length || 0;
                        const newRepliesCount = payload.new.replies.length;

                        if (newRepliesCount > oldRepliesCount) {
                            const lastReply = payload.new.replies[newRepliesCount - 1];
                            if (lastReply.sender_type === 'admin') {
                                toast.success(`رد جديد من ${lastReply.sender_name} على تذكرة: ${payload.new.subject}`);
                            }
                        }
                    }

                    // Refresh tickets list
                    fetchTickets(user);

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
    }, [user, selectedTicket]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newTicket.subject || !newTicket.description) {
            toast.error('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        setSubmitting(true);
        try {
            const ticketData = {
                user_id: user.user_type === 'client' ? user.user_id : null,
                lawyer_id: user.user_type === 'lawyer' ? user.lawyer_id : null,
                submitter_type: user.user_type,
                subject: newTicket.subject,
                description: newTicket.description,
                priority: newTicket.priority,
                status: 'open'
            };

            await createSupportTicket(ticketData);
            toast.success('تم إنشاء التذكرة بنجاح');
            setIsModalOpen(false);
            setNewTicket({ subject: '', description: '', priority: 'medium' });
            fetchTickets(user);
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast.error('حدث خطأ أثناء إنشاء التذكرة');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'open': return 'مفتوحة';
            case 'in_progress': return 'قيد المعالجة';
            case 'resolved': return 'تم الحل';
            case 'closed': return 'مغلقة';
            default: return status;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-600';
            case 'medium': return 'text-yellow-600';
            case 'low': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
            <div className="pt-4 pb-8 sm:pb-12 px-3 sm:px-4 lg:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">الدعم الفني والشكاوى</h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">تابع حالة طلبات الدعم الخاصة بك أو أنشئ طلبًا جديدًا</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 space-x-reverse px-4 sm:px-5 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg font-semibold text-sm sm:text-base touch-manipulation flex-shrink-0"
                    >
                        <Plus className="h-5 w-5" />
                        <span>تذكرة جديدة</span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8 sm:py-12">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm px-4">
                        <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2">لا توجد تذاكر</h3>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">لم تقم بإنشاء أي تذاكر دعم فني بعد</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:gap-6">
                        {tickets.map((ticket) => (
                            <div key={ticket.ticket_id} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition border border-gray-100 dark:border-gray-700">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                                    <div className="flex-1 min-w-0 w-full">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2">
                                            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white break-words">{ticket.subject}</h3>
                                            <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)} flex-shrink-0`}>
                                                {getStatusText(ticket.status)}
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 sm:gap-2">
                                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                            <span>{new Date(ticket.created_at).toLocaleDateString('ar-EG')}</span>
                                        </p>
                                    </div>
                                    <span className={`text-xs sm:text-sm font-medium ${getPriorityColor(ticket.priority)} flex-shrink-0`}>
                                        {ticket.priority === 'high' ? 'عالية الأهمية' : ticket.priority === 'medium' ? 'متوسطة الأهمية' : 'منخفضة الأهمية'}
                                    </span>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{ticket.description}</p>
                                </div>

                                {/* Show replies count and view button */}
                                {ticket.replies && ticket.replies.length > 0 && (
                                    <div className="mt-3 sm:mt-4 border-t border-gray-100 dark:border-gray-700 pt-3 sm:pt-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {ticket.replies.length} {ticket.replies.length === 1 ? 'رد' : 'ردود'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setSelectedTicket(ticket)}
                                                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition touch-manipulation flex-shrink-0"
                                            >
                                                عرض المحادثة
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Show view conversation button if no replies yet */}
                                {(!ticket.replies || ticket.replies.length === 0) && (
                                    <div className="mt-3 sm:mt-4 border-t border-gray-100 dark:border-gray-700 pt-3 sm:pt-4">
                                        <button
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="w-full py-2 sm:py-2.5 text-xs sm:text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition touch-manipulation"
                                        >
                                            في انتظار الرد من الإدارة
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* New Ticket Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">تذكرة جديدة</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 touch-manipulation p-1">
                                <X className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الموضوع</label>
                                <input
                                    type="text"
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none"
                                    placeholder="عنوان المشكلة..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">الأهمية</label>
                                <select
                                    value={newTicket.priority}
                                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none"
                                >
                                    <option value="low">منخفضة</option>
                                    <option value="medium">متوسطة</option>
                                    <option value="high">عالية</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">التفاصيل</label>
                                <textarea
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none h-28 sm:h-32 resize-none"
                                    placeholder="اشرح المشكلة بالتفصيل..."
                                    required
                                />
                            </div>

                            <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium touch-manipulation"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 touch-manipulation"
                                >
                                    {submitting ? 'جاري الإرسال...' : 'إرسال التذكرة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Ticket Conversation Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-start sm:items-center gap-3 p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-2 break-words">{selectedTicket.subject}</h3>
                                <span className={`inline-block px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                                    {getStatusText(selectedTicket.status)}
                                </span>
                            </div>
                            <button onClick={() => { setSelectedTicket(null); setReplyText(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation p-1 flex-shrink-0">
                                <X className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </div>

                        {/* Conversation Area */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
                            {/* Original Message */}
                            <div className="flex gap-2 sm:gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4">
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                                            <span className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">أنت</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(selectedTicket.created_at).toLocaleString('ar-EG')}
                                            </span>
                                        </div>
                                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{selectedTicket.description}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Replies */}
                            {selectedTicket.replies && selectedTicket.replies.length > 0 && selectedTicket.replies.map((reply, index) => (
                                <div key={index} className={`flex gap-2 sm:gap-3 ${reply.sender_type !== 'admin' ? '' : 'flex-row-reverse'}`}>
                                    <div className="flex-shrink-0">
                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${reply.sender_type === 'admin'
                                                ? 'bg-green-100 dark:bg-green-900/30'
                                                : 'bg-blue-100 dark:bg-blue-900/30'
                                            }`}>
                                            {reply.sender_type === 'admin' ? (
                                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                                            ) : (
                                                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`rounded-lg p-3 sm:p-4 ${reply.sender_type === 'admin'
                                                ? 'bg-green-50 dark:bg-green-900/20'
                                                : 'bg-blue-50 dark:bg-blue-900/20'
                                            }`}>
                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                                                <span className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                                                    {reply.sender_type === 'admin' ? reply.sender_name : 'أنت'}
                                                </span>
                                                <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded ${reply.sender_type === 'admin'
                                                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                                                        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                                                    }`}>
                                                    {reply.sender_type === 'admin' ? 'إدارة' : user.user_type === 'client' ? 'عميل' : 'محامي'}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(reply.created_at).toLocaleString('ar-EG')}
                                                </span>
                                            </div>
                                            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{reply.message}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* No replies message */}
                            {(!selectedTicket.replies || selectedTicket.replies.length === 0) && (
                                <div className="text-center py-6 sm:py-8">
                                    <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-3" />
                                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">في انتظار رد الإدارة</p>
                                </div>
                            )}
                        </div>

                        {/* Reply Input */}
                        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
                            <label className="block text-sm sm:text-base text-gray-700 dark:text-gray-300 font-semibold mb-2">إضافة رد</label>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="اكتب ردك هنا..."
                                rows="3"
                            />
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
                                <button
                                    onClick={() => { setSelectedTicket(null); setReplyText(''); }}
                                    className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium touch-manipulation"
                                >
                                    إغلاق
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!replyText.trim()) {
                                            toast.error('يرجى كتابة الرد');
                                            return;
                                        }
                                        try {
                                            const userName = `${user.first_name} ${user.last_name}`;
                                            const userId = user.user_type === 'client' ? user.user_id : user.lawyer_id;
                                            await addReplyToTicket(selectedTicket.ticket_id, user.user_type, userId, userName, replyText);
                                            toast.success('تم إرسال الرد بنجاح');
                                            setReplyText('');
                                            fetchTickets(user);
                                        } catch (error) {
                                            console.error('Error adding reply:', error);
                                            toast.error('حدث خطأ أثناء إرسال الرد');
                                        }
                                    }}
                                    disabled={!replyText.trim()}
                                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                                >
                                    إرسال الرد
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportTickets;
