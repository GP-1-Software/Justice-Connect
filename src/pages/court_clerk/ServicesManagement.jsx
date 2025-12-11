// Court Clerk - Services (Service of Process) Management
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/authHelpers';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

const ServicesManagement = () => {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [services, setServices] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        service_method: 'bailiff',
        defendant_name: '',
        defendant_address: '',
        defendant_phone: '',
        attempt_date: new Date().toISOString().split('T')[0],
        attempt_result: 'pending',
        service_notes: ''
    });

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

    const fetchServices = async (caseId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/court-clerk/cases/${caseId}/services`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setServices(data.data);
            }
        } catch (error) {
            toast.error('فشل في تحميل التبليغات');
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(
                `http://localhost:5000/api/court-clerk/cases/${selectedCase.case_id}/services`,
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        ...formData,
                        case_id: selectedCase.case_id
                    })
                }
            );

            if (response.ok) {
                toast.success('تم إضافة محاولة التبليغ بنجاح');
                setShowModal(false);
                fetchServices(selectedCase.case_id);
                resetForm();
            } else {
                toast.error('فشل في إضافة التبليغ');
            }
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const resetForm = () => {
        setFormData({
            service_method: 'bailiff',
            defendant_name: '',
            defendant_address: '',
            defendant_phone: '',
            attempt_date: new Date().toISOString().split('T')[0],
            attempt_result: 'pending',
            service_notes: ''
        });
    };

    const getResultBadge = (result) => {
        const config = {
            served: { icon: CheckCircle, color: 'green', label: 'تم التبليغ' },
            not_served: { icon: XCircle, color: 'red', label: 'لم يتم التبليغ' },
            refused: { icon: XCircle, color: 'orange', label: 'رفض الاستلام' },
            pending: { icon: Clock, color: 'blue', label: 'معلق' }
        };
        const { icon: Icon, color, label } = config[result] || config.pending;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-700 flex items-center gap-1`}>
                <Icon size={14} />
                {label}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            <CourtClerkHeader 
                title="إدارة التبليغات" 
                subtitle="تسجيل ومتابعة التبليغات القضائية"
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
                            إضافة محاولة تبليغ
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
                                        fetchServices(caseItem.case_id);
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

                    {/* Services List */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        {selectedCase ? (
                            <>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    تبليغات القضية: {selectedCase.case_number || selectedCase.title}
                                </h2>
                                {services.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400">لا توجد محاولات تبليغ</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {services.map(service => (
                                            <div key={service.service_id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{service.defendant_name}</h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">الطريقة: {service.service_method}</p>
                                                    </div>
                                                    {getResultBadge(service.attempt_result)}
                                                </div>
                                                {service.defendant_address && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">العنوان: {service.defendant_address}</p>
                                                )}
                                                {service.defendant_phone && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">الهاتف: {service.defendant_phone}</p>
                                                )}
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">تاريخ المحاولة: {service.attempt_date}</p>
                                                {service.service_notes && (
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                                        {service.service_notes}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">اختر قضية لعرض تبليغاتها</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Service Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">إضافة محاولة تبليغ</h2>
                        <form onSubmit={handleAddService} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">طريقة التبليغ *</label>
                                    <select
                                        value={formData.service_method}
                                        onChange={(e) => setFormData({...formData, service_method: e.target.value})}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                        required
                                    >
                                        <option value="bailiff">محضر</option>
                                        <option value="mail">بريد</option>
                                        <option value="publication">نشر</option>
                                        <option value="electronic">إلكتروني</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نتيجة التبليغ *</label>
                                    <select
                                        value={formData.attempt_result}
                                        onChange={(e) => setFormData({...formData, attempt_result: e.target.value})}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                        required
                                    >
                                        <option value="pending">معلق</option>
                                        <option value="served">تم التبليغ</option>
                                        <option value="not_served">لم يتم التبليغ</option>
                                        <option value="refused">رفض الاستلام</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اسم المدعى عليه *</label>
                                <input
                                    type="text"
                                    value={formData.defendant_name}
                                    onChange={(e) => setFormData({...formData, defendant_name: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">العنوان</label>
                                <input
                                    type="text"
                                    value={formData.defendant_address}
                                    onChange={(e) => setFormData({...formData, defendant_address: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رقم الهاتف</label>
                                <input
                                    type="text"
                                    value={formData.defendant_phone}
                                    onChange={(e) => setFormData({...formData, defendant_phone: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاريخ المحاولة *</label>
                                <input
                                    type="date"
                                    value={formData.attempt_date}
                                    onChange={(e) => setFormData({...formData, attempt_date: e.target.value})}
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ملاحظات</label>
                                <textarea
                                    value={formData.service_notes}
                                    onChange={(e) => setFormData({...formData, service_notes: e.target.value})}
                                    rows={3}
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-2"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                    إضافة
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

export default ServicesManagement;
