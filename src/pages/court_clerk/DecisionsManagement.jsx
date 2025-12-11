// Court Clerk - Decisions Management
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Plus, FileText, AlertTriangle, Info, Gavel, FileQuestion } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/authHelpers';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

const DecisionsManagement = () => {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [decisions, setDecisions] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        decision_type: 'preliminary',
        decision_title: '',
        decision_summary: '',
        ruling: '',
        in_favor_of: '',
        is_appealable: true,
        appeal_deadline: '',
        decision_date: new Date().toISOString().split('T')[0]
    });

    // معلومات توضيحية لكل نوع قرار
    const DECISION_TYPE_INFO = {
        preliminary: {
            label: 'قرار تمهيدي',
            icon: FileQuestion,
            color: 'blue',
            stageEffect: 'لا يغيّر مرحلة الدعوى - تبقى في "الجلسات جارية"',
            description: 'قرار مؤقت أثناء سير الدعوى (مثل: تأجيل، طلب خبرة، إلخ)'
        },
        final_judgment: {
            label: 'حكم نهائي',
            icon: Gavel,
            color: 'red',
            stageEffect: 'يغيّر مرحلة الدعوى حسب قابلية الاستئناف',
            description: 'الحكم الفاصل في الدعوى'
        }
    };

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/court-clerk/cases', {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setCases(data.data);
            }
        } catch (error) {
            toast.error('فشل في تحميل القضايا');
        }
    };

    const fetchDecisions = async (caseId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/court-clerk/cases/${caseId}/decisions`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setDecisions(data.data);
            }
        } catch (error) {
            toast.error('فشل في تحميل القرارات');
        }
    };

    const handleIssueDecision = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(
                `http://localhost:5000/api/court-clerk/cases/${selectedCase.case_id}/decisions`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(formData)
                }
            );

            if (response.ok) {
                toast.success('تم إصدار القرار بنجاح');
                setShowModal(false);
                fetchDecisions(selectedCase.case_id);
                resetForm();
            } else {
                toast.error('فشل في إصدار القرار');
            }
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const resetForm = () => {
        setFormData({
            decision_type: 'preliminary',
            decision_title: '',
            decision_summary: '',
            ruling: '',
            in_favor_of: '',
            is_appealable: true,
            appeal_deadline: '',
            decision_date: new Date().toISOString().split('T')[0]
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            <CourtClerkHeader 
                title="القرارات والأحكام" 
                subtitle="إدخال وإدارة القرارات القضائية"
                showBackButton={true}
                backPath="/court-clerk/dashboard"
            />
            
            {/* Action Button */}
            {selectedCase && (
                <div className="max-w-7xl mx-auto px-4 pt-4 sm:px-6 lg:px-8">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            إصدار قرار
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cases List */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">القضايا</h2>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {cases.map(caseItem => (
                                <div
                                    key={caseItem.case_id}
                                    onClick={() => {
                                        setSelectedCase(caseItem);
                                        fetchDecisions(caseItem.case_id);
                                    }}
                                    className={`p-3 rounded-lg cursor-pointer ${
                                        selectedCase?.case_id === caseItem.case_id
                                            ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                                            : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <p className="font-medium text-gray-900 dark:text-white">{caseItem.case_number || caseItem.title}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{caseItem.case_type}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Decisions List */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        {selectedCase ? (
                            <>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    قرارات القضية: {selectedCase.case_number || selectedCase.title}
                                </h2>
                                {decisions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Scale size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400">لا توجد قرارات صادرة</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {decisions.map(decision => (
                                            <div key={decision.decision_id} className={`p-6 border rounded-lg ${
                                                decision.decision_type === 'final_judgment' 
                                                    ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' 
                                                    : 'border-gray-200 dark:border-gray-600'
                                            }`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2">
                                                        {decision.decision_type === 'final_judgment' ? (
                                                            <Gavel className="text-red-600" size={20} />
                                                        ) : (
                                                            <FileQuestion className="text-blue-600" size={20} />
                                                        )}
                                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{decision.decision_title}</h3>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className={`px-3 py-1 rounded text-xs font-medium ${
                                                            decision.decision_type === 'final_judgment' 
                                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                                                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                        }`}>
                                                            {decision.decision_type === 'final_judgment' ? 'حكم نهائي' : 'قرار تمهيدي'}
                                                        </span>
                                                        {decision.decision_type === 'preliminary' && (
                                                            <span className="text-xs text-gray-500">لم يغيّر مرحلة الدعوى</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-gray-700 dark:text-gray-300 mb-3">{decision.decision_summary}</p>
                                                {decision.ruling && (
                                                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded mb-3">
                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">المنطوق:</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{decision.ruling}</p>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                                    <span>التاريخ: {decision.decision_date}</span>
                                                    {decision.is_appealable && decision.appeal_deadline && (
                                                        <span className="text-orange-600 dark:text-orange-400">
                                                            قابل للاستئناف حتى: {decision.appeal_deadline}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <Scale size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">اختر قضية لعرض قراراتها</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Decision Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">إصدار قرار جديد</h2>
                        <form onSubmit={handleIssueDecision} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع القرار *</label>
                                    <select
                                        value={formData.decision_type}
                                        onChange={(e) => setFormData({...formData, decision_type: e.target.value})}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                        required
                                    >
                                        <option value="preliminary">قرار تمهيدي</option>
                                        <option value="final_judgment">حكم نهائي</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاريخ القرار *</label>
                                    <input
                                        type="date"
                                        value={formData.decision_date}
                                        onChange={(e) => setFormData({...formData, decision_date: e.target.value})}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                        required
                                    />
                                </div>
                            </div>
                            
                            {/* معلومات توضيحية عن نوع القرار */}
                            {formData.decision_type && DECISION_TYPE_INFO[formData.decision_type] && (
                                <div className={`p-4 rounded-lg border ${
                                    formData.decision_type === 'preliminary' 
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                }`}>
                                    <div className="flex items-start gap-3">
                                        <Info className={`mt-0.5 ${formData.decision_type === 'preliminary' ? 'text-blue-600' : 'text-red-600'}`} size={20} />
                                        <div>
                                            <p className={`font-medium ${formData.decision_type === 'preliminary' ? 'text-blue-800 dark:text-blue-300' : 'text-red-800 dark:text-red-300'}`}>
                                                {DECISION_TYPE_INFO[formData.decision_type].description}
                                            </p>
                                            <p className={`text-sm mt-1 ${formData.decision_type === 'preliminary' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                                ⚡ {DECISION_TYPE_INFO[formData.decision_type].stageEffect}
                                            </p>
                                            
                                            {/* توضيح إضافي للحكم النهائي */}
                                            {formData.decision_type === 'final_judgment' && (
                                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                    <p>• إذا كان <strong>قابل للاستئناف</strong> ← ستنتقل الدعوى إلى مرحلة "فترة الاستئناف"</p>
                                                    <p>• إذا كان <strong>غير قابل للاستئناف</strong> ← ستنتقل الدعوى مباشرة إلى مرحلة "قيد التنفيذ"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">عنوان القرار *</label>
                                <input
                                    type="text"
                                    value={formData.decision_title}
                                    onChange={(e) => setFormData({...formData, decision_title: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ملخص القرار *</label>
                                <textarea
                                    value={formData.decision_summary}
                                    onChange={(e) => setFormData({...formData, decision_summary: e.target.value})}
                                    rows={4}
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">منطوق الحكم</label>
                                <textarea
                                    value={formData.ruling}
                                    onChange={(e) => setFormData({...formData, ruling: e.target.value})}
                                    rows={3}
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الحكم لصالح</label>
                                    <select
                                        value={formData.in_favor_of}
                                        onChange={(e) => setFormData({...formData, in_favor_of: e.target.value})}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                    >
                                        <option value="">اختر</option>
                                        <option value="plaintiff">المدعي</option>
                                        <option value="defendant">المدعى عليه</option>
                                        <option value="partial">جزئي</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_appealable}
                                            onChange={(e) => setFormData({...formData, is_appealable: e.target.checked})}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm font-medium">قابل للاستئناف</span>
                                    </label>
                                    {formData.is_appealable && (
                                        <input
                                            type="date"
                                            value={formData.appeal_deadline}
                                            onChange={(e) => setFormData({...formData, appeal_deadline: e.target.value})}
                                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2 mt-2"
                                            placeholder="آخر موعد للاستئناف"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                    إصدار القرار
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DecisionsManagement;
