// ============================================
// Cases Management - إدارة القضايا
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    Scale,
    Calendar,
    User,
    FileText,
    ChevronDown,
    ChevronUp,
    Eye,
    Clock,
    CheckCircle,
    AlertCircle,
    Gavel,
    Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getAuthHeaders } from '../../utils/authHelpers';
import CourtClerkHeader from '../../components/court_clerk/CourtClerkHeader';

// Stage configuration
const STAGES = {
    'submitted': { label: 'تم التقديم', color: '#9e9e9e', bgColor: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-700 dark:text-gray-300' },
    'under_review': { label: 'قيد المراجعة', color: '#ff9800', bgColor: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-700 dark:text-orange-400' },
    'update_required': { label: 'مطلوب تعديل', color: '#ff5252', bgColor: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-700 dark:text-red-400' },
    'ready_for_registration': { label: 'جاهزة للتسجيل', color: '#64b5f6', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-400' },
    'registered': { label: 'مسجلة رسمياً', color: '#2e7d32', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-400' },
    'service_in_progress': { label: 'قيد التبليغ', color: '#1e88e5', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-400' },
    'service_completed': { label: 'تم التبليغ', color: '#43a047', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-400' },
    'awaiting_response': { label: 'بانتظار الرد', color: '#fb8c00', bgColor: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-700 dark:text-orange-400' },
    'first_hearing_scheduled': { label: 'أول جلسة مجدولة', color: '#1565c0', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-400' },
    'hearings_ongoing': { label: 'جلسات جارية', color: '#42a5f5', bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-400' },
    'judgment_issued': { label: 'صدر الحكم', color: '#2e7d32', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-400' },
    'appeal_period': { label: 'فترة الاستئناف', color: '#ffeb3b', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', textColor: 'text-yellow-700 dark:text-yellow-400' },
    'in_execution': { label: 'قيد التنفيذ', color: '#7b1fa2', bgColor: 'bg-purple-100 dark:bg-purple-900/30', textColor: 'text-purple-700 dark:text-purple-400' },
    'fully_executed': { label: 'منفذة بالكامل', color: '#00e676', bgColor: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-400' }
};

const CasesManagement = () => {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stageFilter, setStageFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [expandedCase, setExpandedCase] = useState(null);
    const [stageChanging, setStageChanging] = useState(null);

    useEffect(() => {
        fetchCases();
    }, [stageFilter]);

    const fetchCases = async () => {
        try {
            let url = 'http://localhost:5000/api/court-clerk/cases';
            if (stageFilter) {
                url += `?stage=${stageFilter}`;
            }
            
            const response = await fetch(url, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setCases(data.data || []);
            } else {
                toast.error('فشل في تحميل القضايا');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('حدث خطأ أثناء التحميل');
        } finally {
            setLoading(false);
        }
    };

    const handleStageChange = async (caseId, newStage) => {
        setStageChanging(caseId);
        try {
            const response = await fetch(
                `http://localhost:5000/api/court-clerk/cases/${caseId}/stage`,
                {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        new_stage: newStage,
                        reason: `تم تغيير المرحلة إلى ${STAGES[newStage]?.label || newStage}`
                    })
                }
            );

            if (response.ok) {
                toast.success(`تم تحديث المرحلة إلى: ${STAGES[newStage]?.label}`);
                fetchCases();
            } else {
                const data = await response.json();
                toast.error(data.error || 'فشل في تحديث المرحلة');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('حدث خطأ أثناء التحديث');
        } finally {
            setStageChanging(null);
        }
    };

    const filteredCases = cases.filter(c => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            c.case_number?.toLowerCase().includes(search) ||
            c.title?.toLowerCase().includes(search) ||
            c.court_name?.toLowerCase().includes(search)
        );
    });

    const getStageIcon = (stage) => {
        switch (stage) {
            case 'submitted':
            case 'under_review':
                return <Clock size={16} />;
            case 'registered':
            case 'service_completed':
                return <CheckCircle size={16} />;
            case 'update_required':
                return <AlertCircle size={16} />;
            case 'judgment_issued':
                return <Gavel size={16} />;
            case 'in_execution':
            case 'fully_executed':
                return <Shield size={16} />;
            default:
                return <Scale size={16} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
            {/* Header */}
            <CourtClerkHeader 
                title="إدارة القضايا"
                subtitle="عرض ومتابعة جميع القضايا ومراحلها"
            />

            {/* Search & Filters */}
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Search */}
                        <div className="flex-1 min-w-[250px]">
                            <div className="relative">
                                <Search size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="بحث بالرقم أو العنوان..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Stage Filter */}
                        <div className="min-w-[200px]">
                            <select
                                value={stageFilter}
                                onChange={(e) => setStageFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">جميع المراحل</option>
                                {Object.entries(STAGES).map(([key, { label }]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Toggle Filters */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition"
                        >
                            <Filter size={18} />
                            فلاتر متقدمة
                            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">من تاريخ</label>
                                <input type="date" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">إلى تاريخ</label>
                                <input type="date" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">المحكمة</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg" placeholder="اسم المحكمة" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">نوع الدعوى</label>
                                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg">
                                    <option value="">الكل</option>
                                    <option value="civil">مدني</option>
                                    <option value="criminal">جنائي</option>
                                    <option value="commercial">تجاري</option>
                                    <option value="labor">عمالي</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                    {[
                        { stage: 'submitted', count: cases.filter(c => c.case_stage === 'submitted').length },
                        { stage: 'under_review', count: cases.filter(c => c.case_stage === 'under_review').length },
                        { stage: 'registered', count: cases.filter(c => c.case_stage === 'registered').length },
                        { stage: 'hearings_ongoing', count: cases.filter(c => c.case_stage === 'hearings_ongoing').length },
                        { stage: 'judgment_issued', count: cases.filter(c => c.case_stage === 'judgment_issued').length },
                        { stage: 'in_execution', count: cases.filter(c => c.case_stage === 'in_execution').length },
                        { stage: 'fully_executed', count: cases.filter(c => c.case_stage === 'fully_executed').length }
                    ].map(({ stage, count }) => (
                        <div
                            key={stage}
                            onClick={() => setStageFilter(stageFilter === stage ? '' : stage)}
                            className={`p-3 rounded-lg cursor-pointer transition ${
                                stageFilter === stage ? 'ring-2 ring-blue-500' : ''
                            } ${STAGES[stage]?.bgColor || 'bg-gray-100 dark:bg-gray-700'}`}
                        >
                            <p className="text-2xl font-bold" style={{ color: STAGES[stage]?.color }}>{count}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{STAGES[stage]?.label}</p>
                        </div>
                    ))}
                </div>

                {/* Cases List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">جاري التحميل...</p>
                    </div>
                ) : filteredCases.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                        <Scale size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 text-lg">لا توجد قضايا</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredCases.map((caseItem) => (
                            <div key={caseItem.case_id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                                {/* Case Header */}
                                <div
                                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                    onClick={() => setExpandedCase(expandedCase === caseItem.case_id ? null : caseItem.case_id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-12 h-12 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: `${STAGES[caseItem.case_stage]?.color}20` }}
                                            >
                                                {getStageIcon(caseItem.case_stage)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{caseItem.case_number}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{caseItem.title}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span
                                                className="px-3 py-1 rounded-full text-sm font-medium"
                                                style={{
                                                    backgroundColor: `${STAGES[caseItem.case_stage]?.color}20`,
                                                    color: STAGES[caseItem.case_stage]?.color
                                                }}
                                            >
                                                {STAGES[caseItem.case_stage]?.label || caseItem.case_stage}
                                            </span>
                                            {expandedCase === caseItem.case_id ? 
                                                <ChevronUp size={20} className="text-gray-400" /> : 
                                                <ChevronDown size={20} className="text-gray-400" />
                                            }
                                        </div>
                                    </div>
                                </div>

                                {/* Case Details (Expanded) */}
                                {expandedCase === caseItem.case_id && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/50">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">المحكمة</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{caseItem.court_name || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">نوع الدعوى</p>
                                                <p className="font-medium text-gray-900 dark:text-white">{caseItem.case_type || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">تاريخ التقديم</p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {caseItem.created_at ? new Date(caseItem.created_at).toLocaleDateString('ar-EG') : '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">آخر تحديث</p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {caseItem.stage_updated_at ? new Date(caseItem.stage_updated_at).toLocaleDateString('ar-EG') : '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Stage Change */}
                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تغيير المرحلة:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(STAGES).map(([key, { label, color }]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleStageChange(caseItem.case_id, key)}
                                                        disabled={stageChanging === caseItem.case_id || caseItem.case_stage === key}
                                                        className={`px-3 py-1 text-xs rounded-full transition ${
                                                            caseItem.case_stage === key
                                                                ? 'ring-2 ring-offset-1 dark:ring-offset-gray-800'
                                                                : 'hover:opacity-80'
                                                        }`}
                                                        style={{
                                                            backgroundColor: `${color}20`,
                                                            color: color,
                                                            opacity: caseItem.case_stage === key ? 1 : 0.7
                                                        }}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                            <button
                                                onClick={() => navigate(`/court-clerk/cases/${caseItem.case_id}`)}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                            >
                                                <Eye size={18} />
                                                عرض التفاصيل
                                            </button>
                                            <button
                                                onClick={() => navigate(`/court-clerk/hearings?case=${caseItem.case_id}`)}
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                                            >
                                                <Calendar size={18} />
                                                الجلسات
                                            </button>
                                            <button
                                                onClick={() => navigate(`/court-clerk/decisions?case=${caseItem.case_id}`)}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                            >
                                                <Gavel size={18} />
                                                القرارات
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CasesManagement;
