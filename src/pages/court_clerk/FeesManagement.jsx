// Court Clerk - Fees Management (إدارة الرسوم القضائية)
// Mobile Responsive Version
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Receipt, Plus, CheckCircle, XCircle, Clock, Search,
    CreditCard, FileText, AlertCircle, DollarSign, Eye,
    Printer, Download, Filter, RefreshCw, X, ChevronLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/authHelpers';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

const FeesManagement = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [fees, setFees] = useState([]);
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedFee, setSelectedFee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [caseSearchTerm, setCaseSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        registration_fee: 0,
        stamp_fee: 0,
        justice_fund_fee: 0,
        notification_fee: 0,
        other_fees: 0,
        other_fees_description: ''
    });

    const [confirmationNotes, setConfirmationNotes] = useState('');

    useEffect(() => {
        fetchFees();
        fetchCases();
    }, []);

    const fetchFees = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            else setLoading(true);

            const response = await fetch('https://justice-connect-mobile.onrender.com/api/court-clerk/fees', {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setFees(data.data || []);
            }
        } catch (error) {
            toast.error('فشل في تحميل الرسوم');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchCases = async () => {
        try {
            const response = await fetch('https://justice-connect-mobile.onrender.com/api/court-clerk/cases', {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                // Show all cases (FILING-xxx and CASE-xxx)
                setCases(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching cases:', error);
        }
    };

    const handleIssueFee = async (e) => {
        e.preventDefault();

        const total = calculateTotal();
        if (total <= 0) {
            toast.error('يجب أن يكون إجمالي الرسوم أكبر من صفر');
            return;
        }

        try {
            const response = await fetch('https://justice-connect-mobile.onrender.com/api/court-clerk/fees/issue', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    case_id: selectedCase.case_id,
                    filing_id: selectedCase.filing_id,
                    ...formData
                })
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('تم إصدار فاتورة الرسوم بنجاح');
                setShowIssueModal(false);
                resetForm();
                fetchFees();
                fetchCases();
            } else {
                toast.error(result.error || 'فشل في إصدار الفاتورة');
            }
        } catch (error) {
            toast.error('حدث خطأ في الاتصال');
        }
    };

    const handleConfirmPayment = async () => {
        try {
            const response = await fetch(
                `https://justice-connect-mobile.onrender.com/api/court-clerk/fees/${selectedFee.fee_id}/confirm`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ confirmation_notes: confirmationNotes })
                }
            );

            const result = await response.json();

            if (response.ok) {
                toast.success('تم اعتماد الدفع بنجاح');
                setShowConfirmModal(false);
                setConfirmationNotes('');
                fetchFees();
            } else {
                toast.error(result.error || 'فشل في اعتماد الدفع');
            }
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const resetForm = () => {
        setFormData({
            registration_fee: 0,
            stamp_fee: 0,
            justice_fund_fee: 0,
            notification_fee: 0,
            other_fees: 0,
            other_fees_description: ''
        });
        setSelectedCase(null);
        setCaseSearchTerm('');
    };

    const calculateTotal = () => {
        return (
            parseFloat(formData.registration_fee || 0) +
            parseFloat(formData.stamp_fee || 0) +
            parseFloat(formData.justice_fund_fee || 0) +
            parseFloat(formData.notification_fee || 0) +
            parseFloat(formData.other_fees || 0)
        );
    };

    const getStatusBadge = (status, compact = false) => {
        const config = {
            issued: { icon: Clock, color: 'yellow', label: compact ? 'بانتظار' : 'بانتظار الدفع' },
            paid: { icon: CreditCard, color: 'blue', label: compact ? 'مدفوع' : 'بانتظار الاعتماد' },
            confirmed: { icon: CheckCircle, color: 'green', label: 'مؤكد' },
            cancelled: { icon: XCircle, color: 'red', label: 'ملغاة' }
        };
        const { icon: Icon, color, label } = config[status] || config.issued;
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-${color}-100 text-${color}-700 dark:bg-${color}-900/30 dark:text-${color}-400 flex items-center gap-1 whitespace-nowrap`}>
                <Icon size={compact ? 10 : 12} />
                {label}
            </span>
        );
    };

    const filteredFees = useMemo(() => {
        return fees.filter(fee => {
            if (activeTab === 'pending_payment' && fee.fee_status !== 'issued') return false;
            if (activeTab === 'pending_confirmation' && fee.fee_status !== 'paid') return false;

            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                return (
                    fee.fee_invoice_number?.toLowerCase().includes(search) ||
                    fee.case?.case_number?.toLowerCase().includes(search) ||
                    fee.case?.title?.toLowerCase().includes(search) ||
                    fee.filing?.plaintiff_name?.toLowerCase().includes(search) ||
                    fee.filing?.defendant_name?.toLowerCase().includes(search)
                );
            }
            return true;
        });
    }, [fees, activeTab, searchTerm]);

    // Filtered cases for issue modal
    const filteredCases = useMemo(() => {
        if (!caseSearchTerm) return cases;
        const search = caseSearchTerm.toLowerCase();
        return cases.filter(c =>
            c.case_number?.toLowerCase().includes(search) ||
            c.title?.toLowerCase().includes(search)
        );
    }, [cases, caseSearchTerm]);

    // Stats
    const stats = useMemo(() => {
        const total = fees.length;
        const pendingPayment = fees.filter(f => f.fee_status === 'issued').length;
        const pendingConfirmation = fees.filter(f => f.fee_status === 'paid').length;
        const confirmed = fees.filter(f => f.fee_status === 'confirmed').length;
        return { total, pendingPayment, pendingConfirmation, confirmed };
    }, [fees]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
            <CourtClerkHeader
                title="إدارة الرسوم القضائية"
                subtitle="تحرير واعتماد رسوم الدعاوى"
                showBackButton={true}
                backPath="/court-clerk/dashboard"
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">

                    {/* Statistics Cards */}
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:gap-4 mb-4 scrollbar-hide">
                        <StatCard icon={Receipt} value={stats.total} label="إجمالي الفواتير" color="blue" />
                        <StatCard icon={Clock} value={stats.pendingPayment} label="بانتظار الدفع" color="yellow" />
                        <StatCard icon={CreditCard} value={stats.pendingConfirmation} label="بانتظار الاعتماد" color="purple" />
                        <StatCard icon={CheckCircle} value={stats.confirmed} label="مؤكدة" color="green" />
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 mb-4 scrollbar-hide">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition text-xs sm:text-sm whitespace-nowrap flex items-center gap-1 ${activeTab === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            الكل
                            <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">{stats.total}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('pending_payment')}
                            className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition text-xs sm:text-sm whitespace-nowrap flex items-center gap-1 ${activeTab === 'pending_payment'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            بانتظار الدفع
                            {stats.pendingPayment > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'pending_payment' ? 'bg-white/20' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {stats.pendingPayment}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('pending_confirmation')}
                            className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition text-xs sm:text-sm whitespace-nowrap flex items-center gap-1 ${activeTab === 'pending_confirmation'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            بانتظار الاعتماد
                            {stats.pendingConfirmation > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'pending_confirmation' ? 'bg-white/20' : 'bg-purple-100 text-purple-700'}`}>
                                    {stats.pendingConfirmation}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Search and Actions */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="بحث برقم الفاتورة أو الدعوى..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pr-9 pl-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fetchFees(true)}
                                    disabled={refreshing}
                                    className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl"
                                >
                                    <RefreshCw size={18} className={`text-gray-600 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={() => setShowIssueModal(true)}
                                    className="flex-1 sm:flex-none px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    <Plus size={18} />
                                    <span className="hidden sm:inline">تحرير فاتورة</span>
                                    <span className="sm:hidden">فاتورة جديدة</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Fees List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                            <p className="mt-4 text-gray-500 text-sm">جاري التحميل...</p>
                        </div>
                    ) : filteredFees.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                            <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-base font-medium text-gray-900 dark:text-white">
                                لا توجد فواتير
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                {activeTab === 'pending_payment'
                                    ? 'لا توجد فواتير بانتظار الدفع'
                                    : activeTab === 'pending_confirmation'
                                        ? 'لا توجد فواتير بانتظار الاعتماد'
                                        : 'لم يتم تحرير أي فواتير بعد'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredFees.map((fee) => (
                                <div
                                    key={fee.fee_id}
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 active:scale-[0.99] transition"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Receipt className="text-blue-500 flex-shrink-0" size={16} />
                                                <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                                    {fee.fee_invoice_number}
                                                </span>
                                                {getStatusBadge(fee.fee_status, true)}
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                <span>القضية: {fee.case?.case_number || '-'}</span>
                                                <span>التاريخ: {formatDate(fee.issued_at || fee.created_at)}</span>
                                                <span className="truncate">المدعي: {fee.filing?.plaintiff_name || '-'}</span>
                                                <span className="truncate">المدعى عليه: {fee.filing?.defendant_name || '-'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-lg font-bold text-green-600 whitespace-nowrap">
                                                {fee.total_amount} ₪
                                            </span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedFee(fee);
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {fee.fee_status === 'paid' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedFee(fee);
                                                            setShowConfirmModal(true);
                                                        }}
                                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Issue Fee Modal */}
                {showIssueModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[95vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Receipt className="text-green-600" size={20} />
                                    تحرير فاتورة رسوم
                                </h2>
                                <button
                                    onClick={() => { setShowIssueModal(false); resetForm(); }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleIssueFee} className="p-4 space-y-4">
                                {/* Search and Select Case */}
                                <div className="space-y-3">
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                        اختر القضية *
                                    </label>
                                    
                                    {/* Search Input */}
                                    <div className="relative">
                                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="ابحث برقم القضية..."
                                            value={caseSearchTerm}
                                            onChange={(e) => setCaseSearchTerm(e.target.value)}
                                            className="w-full pr-10 pl-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Select Dropdown */}
                                    <select
                                        value={selectedCase?.case_id || ''}
                                        onChange={(e) => {
                                            const selected = cases.find(c => c.case_id === parseInt(e.target.value));
                                            setSelectedCase(selected);
                                        }}
                                        required
                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 text-sm"
                                    >
                                        <option value="">-- اختر قضية --</option>
                                        {filteredCases.map(c => (
                                            <option key={c.case_id} value={c.case_id}>
                                                {c.case_number} - {c.title?.substring(0, 30)}...
                                            </option>
                                        ))}
                                    </select>
                                    {filteredCases.length === 0 && caseSearchTerm && (
                                        <p className="text-xs text-red-600 mt-1">لا توجد نتائج للبحث</p>
                                    )}
                                    {cases.length === 0 && !caseSearchTerm && (
                                        <p className="text-xs text-yellow-600 mt-1">لا توجد قضايا جاهزة</p>
                                    )}
                                </div>

                                {selectedCase && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                            {selectedCase.case_number}
                                        </p>
                                        <p className="text-xs text-blue-700 dark:text-blue-400">
                                            {selectedCase.case_type || 'مدني'}
                                        </p>
                                    </div>
                                )}

                                {/* Fee Breakdown */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <DollarSign size={16} />
                                        تفصيل الرسوم
                                    </h4>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">رسوم التسجيل</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.registration_fee}
                                                onChange={(e) => setFormData({ ...formData, registration_fee: e.target.value })}
                                                className="w-full p-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">رسوم الطوابع</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.stamp_fee}
                                                onChange={(e) => setFormData({ ...formData, stamp_fee: e.target.value })}
                                                className="w-full p-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">صندوق العدالة</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.justice_fund_fee}
                                                onChange={(e) => setFormData({ ...formData, justice_fund_fee: e.target.value })}
                                                className="w-full p-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">رسوم التبليغ</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.notification_fee}
                                                onChange={(e) => setFormData({ ...formData, notification_fee: e.target.value })}
                                                className="w-full p-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="أخرى"
                                            value={formData.other_fees}
                                            onChange={(e) => setFormData({ ...formData, other_fees: e.target.value })}
                                            className="w-24 p-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="وصف الرسوم الأخرى"
                                            value={formData.other_fees_description}
                                            onChange={(e) => setFormData({ ...formData, other_fees_description: e.target.value })}
                                            className="flex-1 p-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-xl border border-green-200 dark:border-green-800">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">الإجمالي:</span>
                                        <span className="text-xl font-bold text-green-600">{calculateTotal().toFixed(2)} ₪</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={!selectedCase || calculateTotal() <= 0}
                                        className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
                                    >
                                        <Receipt size={18} />
                                        تحرير الفاتورة
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowIssueModal(false); resetForm(); }}
                                        className="flex-1 py-3 bg-gray-200 dark:bg-gray-600 dark:text-white rounded-xl font-medium text-sm"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Confirm Payment Modal */}
                {showConfirmModal && selectedFee && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CheckCircle className="text-green-600" size={20} />
                                    اعتماد الدفع
                                </h2>
                                <button
                                    onClick={() => { setShowConfirmModal(false); setConfirmationNotes(''); }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        رقم الفاتورة: <span className="font-bold">{selectedFee.fee_invoice_number}</span>
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        المبلغ: <span className="font-bold text-green-600">{selectedFee.total_amount} ₪</span>
                                    </p>
                                    {selectedFee.paid_at && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            تاريخ الدفع: {formatDate(selectedFee.paid_at)}
                                        </p>
                                    )}
                                </div>

                                {selectedFee.payment_receipt_url && (
                                    <div className="border rounded-xl p-3">
                                        <a
                                            href={selectedFee.payment_receipt_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline flex items-center gap-2 text-sm"
                                        >
                                            <FileText size={16} />
                                            عرض إيصال الدفع
                                        </a>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        ملاحظات (اختياري)
                                    </label>
                                    <textarea
                                        value={confirmationNotes}
                                        onChange={(e) => setConfirmationNotes(e.target.value)}
                                        rows={2}
                                        className="w-full p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 text-sm"
                                        placeholder="أي ملاحظات..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleConfirmPayment}
                                        className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium text-sm flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18} />
                                        اعتماد
                                    </button>
                                    <button
                                        onClick={() => { setShowConfirmModal(false); setConfirmationNotes(''); }}
                                        className="flex-1 py-3 bg-gray-200 dark:bg-gray-600 dark:text-white rounded-xl font-medium text-sm"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fee Details Modal */}
                {showDetailsModal && selectedFee && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Receipt className="text-blue-600" size={20} />
                                    تفاصيل الفاتورة
                                </h2>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-gray-500">رقم الفاتورة</p>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{selectedFee.fee_invoice_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">الحالة</p>
                                        {getStatusBadge(selectedFee.fee_status)}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">رقم الدعوى</p>
                                        <p className="font-medium text-sm text-gray-900 dark:text-white">{selectedFee.case?.case_number || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">تاريخ الإصدار</p>
                                        <p className="font-medium text-sm text-gray-900 dark:text-white">{formatDate(selectedFee.issued_at || selectedFee.created_at)}</p>
                                    </div>
                                </div>

                                <hr className="dark:border-gray-700" />

                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-gray-900 dark:text-white">تفصيل الرسوم</h4>

                                    {selectedFee.registration_fee > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">رسوم التسجيل</span>
                                            <span className="font-medium">{selectedFee.registration_fee} ₪</span>
                                        </div>
                                    )}
                                    {selectedFee.stamp_fee > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">رسوم الطوابع</span>
                                            <span className="font-medium">{selectedFee.stamp_fee} ₪</span>
                                        </div>
                                    )}
                                    {selectedFee.justice_fund_fee > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">صندوق العدالة</span>
                                            <span className="font-medium">{selectedFee.justice_fund_fee} ₪</span>
                                        </div>
                                    )}
                                    {selectedFee.notification_fee > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">رسوم التبليغ</span>
                                            <span className="font-medium">{selectedFee.notification_fee} ₪</span>
                                        </div>
                                    )}
                                    {selectedFee.other_fees > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                أخرى {selectedFee.other_fees_description && `(${selectedFee.other_fees_description})`}
                                            </span>
                                            <span className="font-medium">{selectedFee.other_fees} ₪</span>
                                        </div>
                                    )}

                                    <hr className="dark:border-gray-700" />

                                    <div className="flex justify-between text-base font-bold">
                                        <span className="text-gray-900 dark:text-white">الإجمالي</span>
                                        <span className="text-green-600">{selectedFee.total_amount} ₪</span>
                                    </div>
                                </div>

                                {selectedFee.fee_status === 'paid' && (
                                    <>
                                        <hr className="dark:border-gray-700" />
                                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl">
                                            <h4 className="font-medium text-sm text-blue-800 dark:text-blue-300 mb-1">معلومات الدفع</h4>
                                            {selectedFee.paid_at && (
                                                <p className="text-xs text-gray-600 dark:text-gray-400">تاريخ الدفع: {formatDate(selectedFee.paid_at)}</p>
                                            )}
                                            {selectedFee.payment_method && (
                                                <p className="text-xs text-gray-600 dark:text-gray-400">طريقة الدفع: {selectedFee.payment_method}</p>
                                            )}
                                        </div>
                                    </>
                                )}

                                {selectedFee.fee_status === 'confirmed' && (
                                    <>
                                        <hr className="dark:border-gray-700" />
                                        <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-xl">
                                            <h4 className="font-medium text-sm text-green-800 dark:text-green-300 mb-1">تم الاعتماد</h4>
                                            {selectedFee.confirmed_at && (
                                                <p className="text-xs text-gray-600 dark:text-gray-400">تاريخ الاعتماد: {formatDate(selectedFee.confirmed_at)}</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ icon: Icon, value, label, color }) => (
    <div className="flex-shrink-0 w-[130px] sm:w-auto bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-2 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg`}>
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{label}</p>
            </div>
        </div>
    </div>
);

export default FeesManagement;
