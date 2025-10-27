import React, { useState } from 'react';
import { Calendar, User, FileText, Tag, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../../../../supabaseClient';

const CaseHeader = ({ caseData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedData, setEditedData] = useState(caseData);

  // Update editedData when caseData changes
  React.useEffect(() => {
    setEditedData(caseData);
  }, [caseData]);

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'active': { label: 'نشط', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      'in_progress': { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      'completed': { label: 'مكتمل', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
      'closed': { label: 'مغلق', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
    };
    return statusMap[status] || statusMap['pending'];
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
      const { error } = await supabase
        .from('cases')
        .update({
          title: editedData.title,
          case_type: editedData.case_type,
          description: editedData.description,
          court_name: editedData.court_name,
          filing_date: editedData.filing_date || null,
          next_hearing_date: editedData.next_hearing_date || null,
          priority: editedData.priority,
          status: editedData.status
        })
        .eq('case_id', caseData.case_id);

      if (error) throw error;
      
      alert('تم حفظ التغييرات بنجاح');
      setIsEditing(false);
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Update error:', error.message);
      alert('حدث خطأ أثناء حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData(caseData);
    setIsEditing(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {isEditing ? (
              <input
                type="text"
                name="title"
                value={editedData.title}
                onChange={handleChange}
                className="text-2xl font-bold border-b-2 border-blue-500 bg-transparent text-gray-900 dark:text-white focus:outline-none flex-1"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {caseData.title || 'قضية بدون عنوان'}
              </h1>
            )}
            {isEditing ? (
              <select
                name="status"
                value={editedData.status}
                onChange={handleChange}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color} border-2 border-blue-500`}
              >
                <option value="pending">قيد الانتظار</option>
                <option value="active">نشط</option>
                <option value="closed">مغلق</option>
              </select>
            ) : (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            رقم القضية: #{caseData.case_id}
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Edit2 className="h-4 w-4" />
              تعديل
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <X className="h-4 w-4" />
                إلغاء
              </button>
            </>
          )}
        </div>
      </div>

      {/* Case Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">نوع القضية</label>
          {isEditing ? (
            <select
              name="case_type"
              value={editedData.case_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            <p className="font-semibold text-gray-900 dark:text-white">{getCaseTypeLabel(caseData.case_type) || '—'}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">الأولوية</label>
          {isEditing ? (
            <select
              name="priority"
              value={editedData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجلة</option>
            </select>
          ) : (
            <p className="font-semibold text-gray-900 dark:text-white">
              {caseData.priority === 'low' && 'منخفضة'}
              {caseData.priority === 'medium' && 'متوسطة'}
              {caseData.priority === 'high' && 'عالية'}
              {caseData.priority === 'urgent' && 'عاجلة'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">اسم المحكمة</label>
          {isEditing ? (
            <input
              type="text"
              name="court_name"
              value={editedData.court_name || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          ) : (
            <p className="font-semibold text-gray-900 dark:text-white">{caseData.court_name || '—'}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">تاريخ رفع القضية</label>
          {isEditing ? (
            <input
              type="date"
              name="filing_date"
              value={editedData.filing_date || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          ) : (
            <p className="font-semibold text-gray-900 dark:text-white">{formatDate(caseData.filing_date)}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">تاريخ الجلسة القادمة</label>
          {isEditing ? (
            <input
              type="date"
              name="next_hearing_date"
              value={editedData.next_hearing_date || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          ) : (
            <p className="font-semibold text-gray-900 dark:text-white">{formatDate(caseData.next_hearing_date)}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">تاريخ الإنشاء</label>
          <p className="font-semibold text-gray-900 dark:text-white">{formatDate(caseData.created_at)}</p>
        </div>
      </div>

      {/* Description */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">الوصف</label>
        {isEditing ? (
          <textarea
            name="description"
            value={editedData.description || ''}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {caseData.description || '—'}
          </p>
        )}
      </div>
    </div>
  );
};

export default CaseHeader;
