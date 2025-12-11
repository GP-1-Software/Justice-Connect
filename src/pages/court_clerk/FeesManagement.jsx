// Court Clerk - Fees Management (إدارة الرسوم القضائية)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Receipt, Plus, CheckCircle, XCircle, Clock, Search,
    CreditCard, FileText, AlertCircle, DollarSign, Eye,
    Printer, Download, Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/authHelpers';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

const FeesManagement = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all'); // all, pending_payment, pending_confirmation
    const [fees, setFees] = useState([]);
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedFee, setSelectedFee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const fetchFees = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/court-clerk/fees', {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setFees(data.data || []);
            }
        } catch (error) {
            toast.error('فشل في تحميل الرسوم');
            console.error('Error fetching fees:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCases = async () => {
        try {
            // Get cases that are ready for fee issuance (ready_for_registration stage and no fee yet)
            const response = await fetch('http://localhost:5000/api/court-clerk/cases', {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                // Filter cases that are ready for registration
                const eligibleCases = (data.data || []).filter(
                    c => c.case_stage === 'ready_for_registration' || c.case_stage === 'under_review'
                );
                setCases(eligibleCases);
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
            const response = await fetch('http://localhost:5000/api/court-clerk/fees/issue', {
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
            console.error('Error issuing fee:', error);
        }
    };

    const handleConfirmPayment = async () => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/court-clerk/fees/${selectedFee.fee_id}/confirm`,
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
            console.error('Error confirming payment:', error);
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

    const getStatusBadge = (status) => {
        const config = {
            issued: { icon: Clock, color: 'yellow', label: 'بانتظار الدفع' },
            paid: { icon: CreditCard, color: 'blue', label: 'تم الدفع - بانتظار الاعتماد' },
            confirmed: { icon: CheckCircle, color: 'green', label: 'مؤكد' },
            cancelled: { icon: XCircle, color: 'red', label: 'ملغاة' }
        };
        const { icon: Icon, color, label } = config[status] || config.issued;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-700 dark:bg-${color}-900/30 dark:text-${color}-400 flex items-center gap-1`}>
                <Icon size={14} />
                {label}
            </span>
        );
    };

    const filteredFees = fees.filter(fee => {
        // Tab filter
        if (activeTab === 'pending_payment' && fee.fee_status !== 'issued') return false;
        if (activeTab === 'pending_confirmation' && fee.fee_status !== 'paid') return false;
        
        // Search filter
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

    const pendingPaymentCount = fees.filter(f => f.fee_status === 'issued').length;
    const pendingConfirmationCount = fees.filter(f => f.fee_status === 'paid').length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            <CourtClerkHeader 
                title="إدارة الرسوم القضائية" 
                subtitle="تحرير واعتماد رسوم الدعاوى"
                showBackButton={true}
                backPath="/court-clerk/dashboard"
            />
            
            {/* Action Button */}
            <div className="max-w-7xl mx-auto px-4 pt-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    {/* Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                activeTab === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            جميع الفواتير ({fees.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('pending_payment')}
                            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                                activeTab === 'pending_payment'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            بانتظار الدفع
                            {pendingPaymentCount > 0 && (
                                <span className="bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full text-xs">
                                    {pendingPaymentCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('pending_confirmation')}
                            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                                activeTab === 'pending_confirmation'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            بانتظار الاعتماد
                            {pendingConfirmationCount > 0 && (
                                <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                                    {pendingConfirmationCount}
                                </span>
                            )}
                        </button>
                    </div>
                    
                    <button
                        onClick={() => setShowIssueModal(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        تحرير فاتورة رسوم
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="max-w-7xl mx-auto px-4 pt-4 sm:px-6 lg:px-8">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="بحث برقم الفاتورة أو رقم الدعوى أو اسم الطرف..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-500">جاري التحميل...</p>
                    </div>
                ) : filteredFees.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                        <Receipt className="mx-auto h-16 w-16 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                            لا توجد فواتير
                        </h3>
                        <p className="mt-2 text-gray-500">
                            {activeTab === 'pending_payment' 
                                ? 'لا توجد فواتير بانتظار الدفع'
                                : activeTab === 'pending_confirmation'
                                    ? 'لا توجد فواتير بانتظار الاعتماد'
                                    : 'لم يتم تحرير أي فواتير رسوم بعد'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                        رقم الفاتورة
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                        القضية
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                        الأطراف
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                        المبلغ
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                        الحالة
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                        التاريخ
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                        الإجراءات
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredFees.map((fee) => (
                                    <tr key={fee.fee_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Receipt className="text-blue-500" size={18} />
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {fee.fee_invoice_number}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {fee.case?.case_number || '-'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {fee.case?.title?.substring(0, 30)}...
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {fee.filing?.plaintiff_name || '-'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                ضد: {fee.filing?.defendant_name || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-lg font-bold text-green-600">
                                                {fee.total_amount} ₪
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(fee.fee_status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(fee.issued_at || fee.created_at).toLocaleDateString('ar-EG')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedFee(fee);
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                                                    title="عرض التفاصيل"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {fee.fee_status === 'paid' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedFee(fee);
                                                            setShowConfirmModal(true);
                                                        }}
                                                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                                                        title="اعتماد الدفع"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Issue Fee Modal */}
            {showIssueModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Receipt className="text-green-600" />
                                تحرير فاتورة رسوم
                            </h2>
                        </div>

                        <form onSubmit={handleIssueFee} className="p-6 space-y-6">
                            {/* Select Case */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    اختر القضية <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedCase?.case_id || ''}
                                    onChange={(e) => {
                                        const selected = cases.find(c => c.case_id === parseInt(e.target.value));
                                        setSelectedCase(selected);
                                    }}
                                    required
                                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="">-- اختر قضية --</option>
                                    {cases.map(c => (
                                        <option key={c.case_id} value={c.case_id}>
                                            {c.case_number} - {c.title?.substring(0, 40)}...
                                        </option>
                                    ))}
                                </select>
                                {cases.length === 0 && (
                                    <p className="text-sm text-yellow-600 mt-1">
                                        لا توجد قضايا جاهزة لتحرير الرسوم
                                    </p>
                                )}
                            </div>

                            {selectedCase && (
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                        تفاصيل القضية
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        رقم الدعوى: {selectedCase.case_number}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        النوع: {selectedCase.case_type || 'مدني'}
                                    </p>
                                </div>
                            )}

                            {/* Fee Breakdown */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <DollarSign size={18} />
                                    تفصيل الرسوم
                                </h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            رسوم التسجيل (₪)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.registration_fee}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                registration_fee: e.target.value
                                            })}
                                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            رسوم الطوابع (₪)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.stamp_fee}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                stamp_fee: e.target.value
                                            })}
                                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            صندوق العدالة (₪)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.justice_fund_fee}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                justice_fund_fee: e.target.value
                                            })}
                                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            رسوم التبليغ (₪)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.notification_fee}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                notification_fee: e.target.value
                                            })}
                                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        رسوم أخرى (₪)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.other_fees}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                other_fees: e.target.value
                                            })}
                                            className="w-32 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <input
                                            type="text"
                                            placeholder="الوصف (اختياري)"
                                            value={formData.other_fees_description}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                other_fees_description: e.target.value
                                            })}
                                            className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                                        إجمالي الرسوم المستحقة:
                                    </span>
                                    <span className="text-2xl font-bold text-green-600">
                                        {calculateTotal().toFixed(2)} ₪
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                                <button
                                    type="submit"
                                    disabled={!selectedCase || calculateTotal() <= 0}
                                    className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Receipt size={20} />
                                    تحرير الفاتورة
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowIssueModal(false);
                                        resetForm();
                                    }}
                                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CheckCircle className="text-green-600" />
                                اعتماد الدفع
                            </h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    رقم الفاتورة: <span className="font-bold">{selectedFee.fee_invoice_number}</span>
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    المبلغ: <span className="font-bold text-green-600">{selectedFee.total_amount} ₪</span>
                                </p>
                                {selectedFee.paid_at && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        تاريخ الدفع: {new Date(selectedFee.paid_at).toLocaleDateString('ar-EG')}
                                    </p>
                                )}
                            </div>

                            {/* Payment Receipt */}
                            {selectedFee.payment_receipt_url && (
                                <div className="border rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                        إيصال الدفع المرفق
                                    </h4>
                                    <a
                                        href={selectedFee.payment_receipt_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline flex items-center gap-2"
                                    >
                                        <FileText size={16} />
                                        عرض الإيصال
                                    </a>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    ملاحظات الاعتماد (اختياري)
                                </label>
                                <textarea
                                    value={confirmationNotes}
                                    onChange={(e) => setConfirmationNotes(e.target.value)}
                                    rows={3}
                                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="أي ملاحظات إضافية..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleConfirmPayment}
                                    className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={20} />
                                    اعتماد الدفع
                                </button>
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setConfirmationNotes('');
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

            {/* Fee Details Modal */}
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

                            {selectedFee.fee_status === 'paid' && (
                                <>
                                    <hr className="dark:border-gray-700" />
                                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                                        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                                            معلومات الدفع
                                        </h4>
                                        {selectedFee.paid_at && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                تاريخ الدفع: {new Date(selectedFee.paid_at).toLocaleDateString('ar-EG')}
                                            </p>
                                        )}
                                        {selectedFee.payment_method && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                طريقة الدفع: {selectedFee.payment_method}
                                            </p>
                                        )}
                                        {selectedFee.payment_reference && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                رقم المرجع: {selectedFee.payment_reference}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {selectedFee.fee_status === 'confirmed' && (
                                <>
                                    <hr className="dark:border-gray-700" />
                                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                                        <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">
                                            تم الاعتماد ✓
                                        </h4>
                                        {selectedFee.confirmed_at && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                تاريخ الاعتماد: {new Date(selectedFee.confirmed_at).toLocaleDateString('ar-EG')}
                                            </p>
                                        )}
                                        {selectedFee.confirmation_notes && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                ملاحظات: {selectedFee.confirmation_notes}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeesManagement;
