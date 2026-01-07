import React, { useState } from 'react';
import { Calendar, User, FileText, Tag, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../../../../supabaseClient';
import { updateCase } from '../../../../services/caseApi';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';

const CaseHeader = ({ caseData, onCaseUpdated }) => {
  const { lawyer } = useLawyerAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedData, setEditedData] = useState(caseData);

  // Update editedData when caseData changes
  React.useEffect(() => {
    setEditedData(caseData);
  }, [caseData]);

  // Court Stage configuration (14 stages from court clerk system)
  const COURT_STAGES = {
    'submitted': { label: 'تم التقديم', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    'under_review': { label: 'قيد المراجعة', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    'update_required': { label: 'مطلوب تعديل', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    'ready_for_registration': { label: 'جاهزة للتسجيل', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    'registered': { label: 'مسجلة رسمياً', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
    'service_in_progress': { label: 'جاري التبليغ', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    'service_completed': { label: 'تم التبليغ', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
    'awaiting_response': { label: 'بانتظار الرد', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    'first_hearing_scheduled': { label: 'جلسة أولى محددة', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
    'hearings_ongoing': { label: 'جلسات جارية', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    'judgment_issued': { label: 'صدر الحكم', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
    'appeal_period': { label: 'فترة استئناف', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    'in_execution': { label: 'قيد التنفيذ', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
    'fully_executed': { label: 'تم التنفيذ', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' }
  };

  // Get court stage info
  const getCourtStageBadge = () => {
    if (caseData?.case_stage && COURT_STAGES[caseData.case_stage]) {
      return COURT_STAGES[caseData.case_stage];
    }
    return null;
  };

  const courtStageInfo = getCourtStageBadge();

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'معلقة', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'active': { label: 'نشط', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      'in_progress': { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      'completed': { label: 'مكتمل', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
      'closed': { label: 'مغلق', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
      'rejected': { label: 'مرفوض', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
    };
    return statusMap[status] || statusMap['pending'];
  };

  const getPriorityLabel = (priority) => {
    const priorityMap = {
      'low': 'منخفضة',
      'medium': 'متوسطة',
      'high': 'عالية',
      'urgent': 'عاجلة'
    };
    return priorityMap[priority] || 'متوسطة';
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      'low': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      'medium': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'urgent': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return colorMap[priority] || colorMap['medium'];
  };

  const getCaseTypeLabel = (caseType) => {
    const typeMap = {
      'civil': 'مدني',
      'criminal': 'جنائي',
      'commercial': 'تجاري',
      'family': 'أسري',
      'labor': 'عمالي',
      'real_estate': 'عقاري',
      'administrative': 'إداري',
      'مدني': 'مدني',
      'جنائي': 'جنائي',
      'تجاري': 'تجاري',
      'أسري': 'أسري',
      'عمالي': 'عمالي',
      'عقاري': 'عقاري',
      'إداري': 'إداري'
    };
    return typeMap[caseType] || caseType;
  };

  const statusInfo = getStatusBadge(isEditing ? editedData.status : caseData.status);

  const handleChange = (e) => {
    setEditedData({
      ...editedData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Compare changes - only include editable fields
      const editableFields = ['title', 'case_type', 'description', 'status', 'priority', 'court_name', 'filing_date', 'next_hearing_date'];
      const changes = {};

      editableFields.forEach(key => {
        const newValue = editedData[key];
        const oldValue = caseData[key];

        // Handle different types properly
        if (newValue !== oldValue && newValue !== null && newValue !== undefined && newValue !== '') {
          changes[key] = newValue;
        }
      });

      if (Object.keys(changes).length === 0) {
        alert('لم يتم إجراء أي تغييرات');
        setIsEditing(false);
        setSaving(false);
        return;
      }

      // Use updateCase service which handles notifications
      const updatedCase = await updateCase(
        caseData.case_id,
        changes,
        lawyer ? { userId: lawyer.lawyer_id, userType: 'lawyer' } : null
      );

      // Create timeline event for case update
      const changesList = Object.entries(changes).map(([key, value]) => {
        const fieldNames = {
          title: 'العنوان',
          case_type: 'نوع القضية',
          description: 'الوصف',
          status: 'الحالة',
          court_name: 'اسم المحكمة',
          filing_date: 'تاريخ التسجيل',
          next_hearing_date: 'تاريخ الجلسة القادمة',
          priority: 'الأولوية'
        };

        // Translate values to Arabic
        let arabicValue = value;
        if (key === 'priority') {
          const priorityMap = {
            'low': 'منخفضة',
            'medium': 'متوسطة',
            'high': 'عالية',
            'urgent': 'عاجلة'
          };
          arabicValue = priorityMap[value] || value;
        } else if (key === 'status') {
          const statusMap = {
            'active': 'نشط',
            'pending': 'قيد الانتظار',
            'closed': 'مغلق',
            'rejected': 'مرفوض'
          };
          arabicValue = statusMap[value] || value;
        } else if (key === 'case_type') {
          const typeMap = {
            'civil': 'مدني',
            'criminal': 'جنائي',
            'commercial': 'تجاري',
            'family': 'أسري',
            'labor': 'عمالي',
            'real_estate': 'عقاري',
            'administrative': 'إداري'
          };
          arabicValue = typeMap[value] || value;
        } else if (key === 'filing_date' || key === 'next_hearing_date') {
          arabicValue = new Date(value).toLocaleDateString('ar-EG');
        }

        return `${fieldNames[key] || key}: ${arabicValue}`;
      }).join('\n');

      const { data: timelineEvent, error: timelineError } = await supabase
        .from('timeline_events')
        .insert([{
          case_id: caseData.case_id,
          event_type: 'case_edit',
          author_id: caseData.assigned_lawyer_id,
          author_type: 'lawyer',
          title: 'تحديث معلومات القضية',
          description: changesList,
          visibility: 'all'
        }])
        .select()
        .single();

      if (timelineError) throw timelineError;

      // Update parent state with new data
      if (onCaseUpdated) {
        onCaseUpdated(updatedCase, timelineEvent);
      }

      setIsEditing(false);
      alert('تم التحديث بنجاح');
    } catch (error) {
      console.error('Update error:', error.message);
      alert('حدث خطأ أثناء تحديث القضية');
    } finally {
      setSaving(false);
    }
  };

  const isRejected = caseData.status === 'rejected';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow p-4 sm:p-6">
      {/* Rejection Reason Banner */}
      {isRejected && caseData.rejection_reason && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <X className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-400 mb-1">
                سبب الرفض:
              </h4>
              <p className="text-sm text-red-800 dark:text-red-300">
                {caseData.rejection_reason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
            {isEditing ? editedData.title : caseData.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isRejected && isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 touch-manipulation"
              >
                {saving ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">حفظ</span>
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedData(caseData);
                }}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-700 transition touch-manipulation"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">إلغاء</span>
              </button>
            </>
          ) : !isRejected ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition touch-manipulation"
            >
              <Edit2 className="h-4 w-4" />
              <span className="hidden sm:inline">تعديل</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Case Info */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Case Type */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">نوع القضية</label>
          {isEditing ? (
            <select
              name="case_type"
              value={editedData.case_type || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">اختر نوع القضية</option>
              <option value="مدني">مدني</option>
              <option value="جنائي">جنائي</option>
              <option value="تجاري">تجاري</option>
              <option value="أسري">أسري</option>
              <option value="عمالي">عمالي</option>
              <option value="عقاري">عقاري</option>
              <option value="إداري">إداري</option>
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {getCaseTypeLabel(caseData.case_type)}
              </span>
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الحالة</label>
          {isEditing ? (
            <select
              name="status"
              value={editedData.status || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="active">نشط</option>
              <option value="pending">قيد الانتظار</option>
              <option value="closed">مغلق</option>
              {caseData.status === 'rejected' && <option value="rejected">مرفوض</option>}
            </select>
          ) : (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          )}
        </div>

        {/* Court Stage - مرحلة المحكمة */}
        {courtStageInfo && (
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">مرحلة المحكمة</label>
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${courtStageInfo.color}`}>
              {courtStageInfo.label}
            </span>
          </div>
        )}

        {/* Priority */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الأولوية</label>
          {isEditing ? (
            <select
              name="priority"
              value={editedData.priority || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجلة</option>
            </select>
          ) : (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${getPriorityColor(caseData.priority)}`}>
              {getPriorityLabel(caseData.priority)}
            </span>
          )}
        </div>

        {/* Court Name */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">اسم المحكمة</label>
          {isEditing ? (
            <input
              type="text"
              name="court_name"
              value={editedData.court_name || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 break-words">
                {caseData.court_name || '—'}
              </span>
            </div>
          )}
        </div>

        {/* Filing Date */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">تاريخ التسجيل</label>
          {isEditing ? (
            <input
              type="date"
              name="filing_date"
              value={editedData.filing_date || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {(caseData.filing_date || caseData.created_at) ? new Date(caseData.filing_date || caseData.created_at).toLocaleDateString('ar-EG') : '—'}
              </span>
            </div>
          )}
        </div>

        {/* Next Hearing Date */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">تاريخ الجلسة القادمة</label>
          {isEditing ? (
            <input
              type="date"
              name="next_hearing_date"
              value={editedData.next_hearing_date || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 sm:py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                {caseData.next_hearing_date ? new Date(caseData.next_hearing_date).toLocaleDateString('ar-EG') : '—'}
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default CaseHeader;