// Court Clerk - Hearings Management
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Clock, AlertCircle, CheckCircle, XCircle, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/authHelpers';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

const HearingsManagement = () => {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [hearings, setHearings] = useState([]);
    const [postponeRequests, setPostponeRequests] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('hearings'); // 'hearings' or 'postpone_requests'

    const [formData, setFormData] = useState({
        hearing_type: 'first_hearing',
        hearing_date: '',
        hearing_time: '',
        hearing_summary: '',
        judge_notes: ''
    });

    useEffect(() => {
        fetchCases();
        fetchPostponeRequests();
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
        } finally {
            setLoading(false);
        }
    };

    const fetchPostponeRequests = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/court-clerk/postpone-requests', {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setPostponeRequests(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching postpone requests:', error);
        }
    };

    const fetchHearings = async (caseId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/court-clerk/cases/${caseId}/hearings`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setHearings(data.data);
            }
        } catch (error) {
            toast.error('فشل في تحميل الجلسات');
        }
    };

    const handleScheduleHearing = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(
                `http://localhost:5000/api/court-clerk/cases/${selectedCase.case_id}/hearings`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(formData)
                }
            );

            if (response.ok) {
                toast.success('تم جدولة الجلسة بنجاح');
                setShowModal(false);
                fetchHearings(selectedCase.case_id);
            } else {
                toast.error('فشل في جدولة الجلسة');
            }
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            <CourtClerkHeader 
                title="إدارة الجلسات" 
                subtitle="جدولة ومتابعة الجلسات القضائية"
                showBackButton={true}
                backPath="/court-clerk/dashboard"
            />
            
            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 pt-4 sm:px-6 lg:px-8">
                <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-4">
                    <button
                        onClick={() => setActiveTab('hearings')}
                        className={`pb-3 px-4 font-medium transition ${
                            activeTab === 'hearings' 
                                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Calendar className="inline-block w-5 h-5 ml-2" />
                        الجلسات
                    </button>
                    <button
                        onClick={() => setActiveTab('postpone_requests')}
                        className={`pb-3 px-4 font-medium transition relative ${
                            activeTab === 'postpone_requests' 
                                ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Clock className="inline-block w-5 h-5 ml-2" />
                        طلبات التأجيل
                        {postponeRequests.length > 0 && (
                            <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {postponeRequests.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Postpone Requests Tab */}
            {activeTab === 'postpone_requests' && (
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <AlertCircle className="text-orange-500" />
                            طلبات التأجيل من المحامين
                        </h2>
                        {postponeRequests.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">لا توجد طلبات تأجيل معلقة</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {postponeRequests.map(request => (
                                    <div key={request.event_id} className="p-4 border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-orange-500" />
                                                    {request.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    القضية: {request.case?.case_number || request.case?.title || 'غير محدد'}
                                                </p>
                                            </div>
                                            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded-full text-xs">
                                                معلق
                                            </span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 mb-3 bg-white dark:bg-gray-700 p-3 rounded-lg">
                                            {request.description}
                                        </p>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                تاريخ الطلب: {new Date(request.created_at).toLocaleDateString('ar-EG', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    if (request.case?.case_id) {
                                                        setActiveTab('hearings');
                                                        const caseItem = cases.find(c => c.case_id === request.case.case_id);
                                                        if (caseItem) {
                                                            setSelectedCase(caseItem);
                                                            fetchHearings(caseItem.case_id);
                                                        }
                                                    }
                                                }}
                                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                            >
                                                عرض جلسات القضية
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Hearings Tab */}
            {activeTab === 'hearings' && (
                <>
            {/* Action Button */}
            {selectedCase && (
                <div className="max-w-7xl mx-auto px-4 pt-4 sm:px-6 lg:px-8">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            جدولة جلسة جديدة
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
                                        fetchHearings(caseItem.case_id);
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

                    {/* Hearings List */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        {selectedCase ? (
                            <>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    جلسات القضية: {selectedCase.case_number || selectedCase.title}
                                </h2>
                                {hearings.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400">لا توجد جلسات مجدولة</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {hearings.map(hearing => (
                                            <div key={hearing.hearing_id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">الجلسة #{hearing.hearing_number}</h3>
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        hearing.hearing_status === 'scheduled' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                        hearing.hearing_status === 'held' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                                    }`}>
                                                        {hearing.hearing_status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">التاريخ: {hearing.hearing_date}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">الوقت: {hearing.hearing_time}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">النوع: {hearing.hearing_type}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">اختر قضية لعرض جلساتها</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </>
            )}

            {/* Schedule Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">جدولة جلسة جديدة</h2>
                        <form onSubmit={handleScheduleHearing} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع الجلسة *</label>
                                <select
                                    value={formData.hearing_type}
                                    onChange={(e) => setFormData({...formData, hearing_type: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                    required
                                >
                                    <option value="first_hearing">أول جلسة</option>
                                    <option value="continuation">متابعة</option>
                                    <option value="evidence">جلسة بينات</option>
                                    <option value="witness">جلسة شهود</option>
                                    <option value="final_hearing">جلسة ختامية</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">التاريخ *</label>
                                <input
                                    type="date"
                                    value={formData.hearing_date}
                                    onChange={(e) => setFormData({...formData, hearing_date: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الوقت *</label>
                                <input
                                    type="time"
                                    value={formData.hearing_time}
                                    onChange={(e) => setFormData({...formData, hearing_time: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                    جدولة
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
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

export default HearingsManagement;
