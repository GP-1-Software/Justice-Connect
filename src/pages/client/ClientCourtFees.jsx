// Client Court Fees Page - صفحة رسوم المحكمة للعميل
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Receipt, Clock, CheckCircle, AlertCircle, CreditCard,
    FileText, Search, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useClientAuth } from '../../hooks/useClientAuth';
import { 
    getClientCourtFees, 
    submitCourtFeePayment
} from '../../services/courtFeesService';

const ClientCourtFees = () => {
    const navigate = useNavigate();
    const { userProfile } = useClientAuth();
    const clientId = userProfile?.user_id;

    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showPayModal, setShowPayModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedFee, setSelectedFee] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [paymentData, setPaymentData] = useState({
        payment_reference: ''
    });

    useEffect(() => {
        if (clientId) {
            fetchFees();
        }
    }, [clientId]);

    const fetchFees = async () => {
        try {
            setLoading(true);
            const { data, error } = await getClientCourtFees(clientId);
            
            if (error) throw error;
            setFees(data || []);
        } catch (error) {
            toast.error('فشل في تحميل الرسوم');
            console.error('Error fetching fees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayFee = async () => {
        try {
            setSubmitting(true);

            // Submit payment
            const { data, error } = await submitCourtFeePayment(selectedFee.fee_id, {
                client_id: clientId,
                payment_reference: paymentData.payment_reference
            });

            if (error) throw error;

            toast.success('تم تسجيل الدفع بنجاح! سيتم مراجعة واعتماد الدفع من قبل قلم المحكمة.');
            setShowPayModal(false);
            resetPaymentForm();
            fetchFees();

        } catch (error) {
            toast.error('فشل في تسجيل الدفع: ' + (error.message || 'حدث خطأ'));
            console.error('Error paying fee:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const resetPaymentForm = () => {
        setPaymentData({
            payment_reference: ''
        });
        setSelectedFee(null);
    };

    const getStatusBadge = (status) => {
        const config = {
            issued: { icon: AlertCircle, color: 'yellow', label: 'بانتظار الدفع' },
            paid: { icon: Clock, color: 'blue', label: 'بانتظار الاعتماد' },
            confirmed: { icon: CheckCircle, color: 'green', label: 'مؤكد' },
            cancelled: { icon: AlertCircle, color: 'red', label: 'ملغاة' }
        };
        const { icon: Icon, color, label } = config[status] || config.issued;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-700 dark:bg-${color}-900/30 dark:text-${color}-400 flex items-center gap-1 inline-flex`}>
                <Icon size={14} />
                {label}
            </span>
        );
    };

    const filteredFees = useMemo(() => {
        let result = fees;

        // Tab filter
        if (activeTab === 'pending') {
            result = result.filter(f => f.fee_status === 'issued');
        } else if (activeTab === 'paid') {
            result = result.filter(f => ['paid', 'confirmed'].includes(f.fee_status));
        }

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(f =>
                f.fee_invoice_number?.toLowerCase().includes(search) ||
                f.case?.case_number?.toLowerCase().includes(search) ||
                f.case?.title?.toLowerCase().includes(search)
            );
        }

        return result;
    }, [fees, activeTab, searchTerm]);

    const stats = useMemo(() => ({
        total: fees.length,
        pending: fees.filter(f => f.fee_status === 'issued').length,
        pending_confirmation: fees.filter(f => f.fee_status === 'paid').length,
        confirmed: fees.filter(f => f.fee_status === 'confirmed').length,
        total_pending: fees
            .filter(f => f.fee_status === 'issued')
            .reduce((sum, f) => sum + parseFloat(f.total_amount || 0), 0),
        total_paid: fees
            .filter(f => ['paid', 'confirmed'].includes(f.fee_status))
            .reduce((sum, f) => sum + parseFloat(f.total_amount || 0), 0)
    }), [fees]);

    const tabs = [
        { id: 'all', label: 'الكل', count: fees.length },
        { id: 'pending', label: 'بانتظار الدفع', count: stats.pending },
        { id: 'paid', label: 'مدفوعة', count: stats.pending_confirmation + stats.confirmed }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" dir="rtl">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">رسوم المحكمة</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        عرض ودفع رسوم الدعاوى القضائية
                    </p>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FileText className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">إجمالي الفواتير</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                <AlertCircle className="text-yellow-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">بانتظار الدفع</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {stats.pending}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {stats.total_pending.toFixed(2)} ₪
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Clock className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">بانتظار الاعتماد</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {stats.pending_confirmation}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <CheckCircle className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">مدفوعة ومؤكدة</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {stats.confirmed}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {stats.total_paid.toFixed(2)} ₪
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="بحث برقم الفاتورة أو رقم الدعوى..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pr-10 pl-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4 border-b border-gray-200 dark:border-gray-700">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 font-medium transition-colors relative ${
                                    activeTab === tab.id
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                                }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className="mr-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fees List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500">جاري التحميل...</p>
                    </div>
                ) : filteredFees.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                        <Receipt className="mx-auto h-16 w-16 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                            لا توجد رسوم
                        </h3>
                        <p className="mt-2 text-gray-500">
                            {activeTab === 'pending' 
                                ? 'لا توجد رسوم بانتظار الدفع'
                                : 'لم يتم إصدار أي رسوم للدعاوى الخاصة بك'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFees.map((fee) => (
                            <div 
                                key={fee.fee_id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Receipt className="text-blue-600" size={20} />
                                            {fee.fee_invoice_number}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {fee.case?.case_number || 'بدون رقم'}
                                        </p>
                                    </div>
                                    {getStatusBadge(fee.fee_status)}
                                </div>

                                <div className="border-t dark:border-gray-700 pt-4 mb-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {fee.case?.title?.substring(0, 50)}...
                                    </p>
                                </div>

                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-500">المبلغ المستحق</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        {fee.total_amount} ₪
                                    </span>
                                </div>

                                <div className="text-sm text-gray-500 mb-4">
                                    تاريخ الإصدار: {new Date(fee.issued_at || fee.created_at).toLocaleDateString('ar-EG')}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedFee(fee);
                                            setShowDetailsModal(true);
                                        }}
                                        className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                                    >
                                        <Eye size={18} />
                                        التفاصيل
                                    </button>
                                    
                                    {fee.fee_status === 'issued' && (
                                        <button
                                            onClick={() => {
                                                setSelectedFee(fee);
                                                setShowPayModal(true);
                                            }}
                                            className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                                        >
                                            <CreditCard size={18} />
                                            ادفع الآن
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pay Modal */}
            {showPayModal && selectedFee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CreditCard className="text-green-600" />
                                دفع الرسوم
                            </h2>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Fee Summary */}
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    رقم الفاتورة: <span className="font-bold">{selectedFee.fee_invoice_number}</span>
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    رقم الدعوى: <span className="font-bold">{selectedFee.case?.case_number}</span>
                                </p>
                                <p className="text-lg font-bold text-green-600 mt-2">
                                    المبلغ: {selectedFee.total_amount} ₪
                                </p>
                            </div>

                            {/* Payment Instructions */}
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                                    تعليمات الدفع
                                </h4>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                                    <li>توجه إلى مقر المحكمة لدفع الرسوم</li>
                                    <li>أو قم بتحويل المبلغ إلى حساب المحكمة</li>
                                    <li>أدخل رقم الإيصال أو الحوالة أدناه</li>
                                    <li>سيتم مراجعة الدفع من قبل قلم المحكمة</li>
                                </ul>
                            </div>

                            {/* Payment Reference */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    رقم الإيصال / الحوالة (اختياري)
                                </label>
                                <input
                                    type="text"
                                    value={paymentData.payment_reference}
                                    onChange={(e) => setPaymentData({ ...paymentData, payment_reference: e.target.value })}
                                    placeholder="رقم الحوالة البنكية أو رقم الإيصال"
                                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                                <button
                                    onClick={handlePayFee}
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            جاري الإرسال...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={20} />
                                            تأكيد الدفع
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPayModal(false);
                                        resetPaymentForm();
                                    }}
                                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedFee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Receipt className="text-blue-600" />
                                تفاصيل الفاتورة
                            </h2>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">رقم الفاتورة</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {selectedFee.fee_invoice_number}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">الحالة</p>
                                    {getStatusBadge(selectedFee.fee_status)}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">رقم الدعوى</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {selectedFee.case?.case_number || '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">تاريخ الإصدار</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {new Date(selectedFee.issued_at || selectedFee.created_at).toLocaleDateString('ar-EG')}
                                    </p>
                                </div>
                            </div>

                            <hr className="dark:border-gray-700" />

                            <div className="space-y-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">تفصيل الرسوم</h4>
                                
                                {selectedFee.registration_fee > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">رسوم التسجيل</span>
                                        <span className="font-medium">{selectedFee.registration_fee} ₪</span>
                                    </div>
                                )}
                                {selectedFee.stamp_fee > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">رسوم الطوابع</span>
                                        <span className="font-medium">{selectedFee.stamp_fee} ₪</span>
                                    </div>
                                )}
                                {selectedFee.justice_fund_fee > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">صندوق العدالة</span>
                                        <span className="font-medium">{selectedFee.justice_fund_fee} ₪</span>
                                    </div>
                                )}
                                {selectedFee.notification_fee > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">رسوم التبليغ</span>
                                        <span className="font-medium">{selectedFee.notification_fee} ₪</span>
                                    </div>
                                )}
                                {selectedFee.other_fees > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            رسوم أخرى {selectedFee.other_fees_description && `(${selectedFee.other_fees_description})`}
                                        </span>
                                        <span className="font-medium">{selectedFee.other_fees} ₪</span>
                                    </div>
                                )}
                                
                                <hr className="dark:border-gray-700" />
                                
                                <div className="flex justify-between text-lg font-bold">
                                    <span className="text-gray-900 dark:text-white">الإجمالي</span>
                                    <span className="text-green-600">{selectedFee.total_amount} ₪</span>
                                </div>
                            </div>

                            {selectedFee.fee_status === 'issued' && (
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setShowPayModal(true);
                                    }}
                                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                                >
                                    <CreditCard size={20} />
                                    ادفع الآن
                                </button>
                            )}

                            {selectedFee.fee_status === 'paid' && (
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                                    <p className="text-blue-800 dark:text-blue-300">
                                        ✓ تم استلام الدفع. جاري المراجعة من قبل قلم المحكمة.
                                    </p>
                                </div>
                            )}

                            {selectedFee.fee_status === 'confirmed' && (
                                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                                    <p className="text-green-800 dark:text-green-300">
                                        ✓ تم اعتماد الدفع بنجاح.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientCourtFees;
