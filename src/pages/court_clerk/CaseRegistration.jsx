// ============================================
// Case Registration - تسجيل القضايا
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/authHelpers';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

const CaseRegistration = () => {
    const navigate = useNavigate();
    const [readyFilings, setReadyFilings] = useState([]);
    const [selectedFiling, setSelectedFiling] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        registry_number: '',
        official_case_number: '',
        registration_date: new Date().toISOString().split('T')[0],
        court_fees: ''
    });

    useEffect(() => {
        fetchReadyFilings();
    }, []);

    const fetchReadyFilings = async () => {
        try {
            const response = await fetch(
                'http://localhost:5000/api/court-clerk/filings?status=ready_for_registration',
                {
                    headers: getAuthHeaders()
                }
            );

            if (response.ok) {
                const data = await response.json();
                setReadyFilings(data.data);
            } else {
                toast.error('فشل في تحميل اللوائح');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('حدث خطأ أثناء التحميل');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!selectedFiling) {
            toast.error('الرجاء اختيار لائحة');
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(
                `http://localhost:5000/api/court-clerk/filings/${selectedFiling.filing_id}/register`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(formData)
                }
            );

            if (response.ok) {
                toast.success('تم تسجيل القضية بنجاح');
                setSelectedFiling(null);
                setFormData({
                    registry_number: '',
                    official_case_number: '',
                    registration_date: new Date().toISOString().split('T')[0],
                    court_fees: ''
                });
                fetchReadyFilings();
            } else {
                const data = await response.json();
                toast.error(data.error || 'فشل في تسجيل القضية');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('حدث خطأ أثناء التسجيل');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            <CourtClerkHeader 
                title="تسجيل القضايا" 
                subtitle="تسجيل القضايا رسمياً وإصدار أرقام القيد والدعوى"
                showBackButton={true}
                backPath="/court-clerk/dashboard"
            />

            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Left: Ready Filings List */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">اللوائح الجاهزة للتسجيل ({readyFilings.length})</h2>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : readyFilings.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                                <CheckCircle size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">لا توجد لوائح جاهزة للتسجيل</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {readyFilings.map(filing => (
                                    <div
                                        key={filing.filing_id}
                                        onClick={() => setSelectedFiling(filing)}
                                        className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer transition ${
                                            selectedFiling?.filing_id === filing.filing_id
                                                ? 'border-2 border-blue-500'
                                                : 'hover:shadow-lg dark:hover:shadow-gray-700'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{filing.filing_number}</h3>
                                            {selectedFiling?.filing_id === filing.filing_id && (
                                                <CheckCircle size={20} className="text-blue-500" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">المحكمة: {filing.court_name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">المدعي: {filing.plaintiff_name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">المدعى عليه: {filing.defendant_name}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Registration Form */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">بيانات التسجيل</h2>
                        
                        {selectedFiling ? (
                            <form onSubmit={handleRegister} className="space-y-6">
                                {/* Selected Filing Info */}
                                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">اللائحة المختارة</h3>
                                    <p className="text-sm text-blue-800 dark:text-blue-400">رقم اللائحة: {selectedFiling.filing_number}</p>
                                    <p className="text-sm text-blue-800 dark:text-blue-400">المحكمة: {selectedFiling.court_name}</p>
                                    <p className="text-sm text-blue-800 dark:text-blue-400">نوع الدعوى: {selectedFiling.case_type}</p>
                                </div>

                                {/* Registry Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        رقم القيد *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.registry_number}
                                        onChange={(e) => setFormData({...formData, registry_number: e.target.value})}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                                        placeholder="أدخل رقم القيد"
                                    />
                                </div>

                                {/* Official Case Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        رقم الدعوى الرسمي *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.official_case_number}
                                        onChange={(e) => setFormData({...formData, official_case_number: e.target.value})}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                                        placeholder="أدخل رقم الدعوى الرسمي"
                                    />
                                </div>

                                {/* Registration Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        تاريخ القيد *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.registration_date}
                                        onChange={(e) => setFormData({...formData, registration_date: e.target.value})}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Court Fees */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        رسوم الدعوى (ريال سعودي)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.court_fees}
                                        onChange={(e) => setFormData({...formData, court_fees: e.target.value})}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        سيتم إنشاء فاتورة تلقائياً إذا كانت الرسوم أكبر من صفر
                                    </p>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 flex items-center justify-center gap-2"
                                >
                                    <Save size={20} />
                                    {submitting ? 'جاري التسجيل...' : 'تسجيل القضية'}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-12">
                                <CheckCircle size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">اختر لائحة من القائمة لتسجيلها</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseRegistration;
