import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';
import { X, Save, Loader2 } from 'lucide-react';

const AddCaseModal = ({ isOpen, onClose, onCaseAdded }) => {
  const { t } = useTranslation();
  const { lawyer } = useLawyerAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    case_title: '',
    case_type: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    description: '',
    court_name: '',
    case_number: '',
    filing_date: '',
    next_hearing_date: '',
    priority: 'medium',
    status: 'active'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lawyer) return;

    setLoading(true);
    try {
      // Insert case (client_id can be null for lawyer-created cases)
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .insert([
          {
            client_id: null, // Lawyer-created case without client
            assigned_lawyer_id: lawyer.lawyer_id,
            title: formData.case_title, // Database column is 'title', not 'case_title'
            case_type: formData.case_type,
            description: formData.description,
            court_name: formData.court_name,
            case_number: formData.case_number,
            filing_date: formData.filing_date || null,
            next_hearing_date: formData.next_hearing_date || null,
            priority: formData.priority,
            status: formData.status
          }
        ])
        .select()
        .single();

      if (caseError) {
        console.error('Case insert error:', caseError);
        throw caseError;
      }

      // Create timeline event for case creation
      const { error: timelineError } = await supabase
        .from('timeline_events')
        .insert([
          {
            case_id: caseData.case_id,
            event_type: 'case_created',
            author_id: lawyer.lawyer_id,
            author_type: 'lawyer',
            title: 'تم إنشاء القضية',
            description: `تم إنشاء القضية: ${formData.case_title}`,
            visibility: 'public'
          }
        ]);

      if (timelineError) {
        console.warn('Timeline event error:', timelineError);
        // Continue even if timeline fails
      }

      alert(t('cases.caseAddedSuccess') || 'تمت إضافة القضية بنجاح');
      if (onCaseAdded) onCaseAdded(caseData);
      onClose();
      
      // Reset form
      setFormData({
        case_title: '',
        case_type: '',
        client_name: '',
        client_phone: '',
        client_email: '',
        description: '',
        court_name: '',
        case_number: '',
        filing_date: '',
        next_hearing_date: '',
        priority: 'medium',
        status: 'active'
      });
    } catch (error) {
      console.error('Add case error:', error.message);
      alert(t('cases.caseAddError') || 'حدث خطأ أثناء إضافة القضية');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('cases.addNewCase') || 'إضافة قضية جديدة'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Case Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('cases.caseTitle') || 'عنوان القضية'} *
              </label>
              <input
                type="text"
                name="case_title"
                value={formData.case_title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Case Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('cases.caseType') || 'نوع القضية'} *
              </label>
              <select
                name="case_type"
                value={formData.case_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">اختر نوع القضية</option>
                <option value="civil">مدني</option>
                <option value="criminal">جنائي</option>
                <option value="commercial">تجاري</option>
                <option value="family">أسري</option>
                <option value="labor">عمالي</option>
                <option value="real_estate">عقاري</option>
                <option value="administrative">إداري</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('cases.priority') || 'الأولوية'}
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="urgent">عاجلة</option>
              </select>
            </div>

            {/* Court Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('cases.courtName') || 'اسم المحكمة'}
              </label>
              <input
                type="text"
                name="court_name"
                value={formData.court_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Case Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('cases.caseNumber') || 'رقم القضية'}
              </label>
              <input
                type="text"
                name="case_number"
                value={formData.case_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Filing Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('cases.filingDate') || 'تاريخ رفع القضية'}
              </label>
              <input
                type="date"
                name="filing_date"
                value={formData.filing_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Next Hearing Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('cases.nextHearing') || 'تاريخ الجلسة القادمة'}
              </label>
              <input
                type="date"
                name="next_hearing_date"
                value={formData.next_hearing_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('cases.description') || 'الوصف'}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="أدخل تفاصيل القضية..."
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 mt-6 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
            >
              {t('actions.cancel') || 'إلغاء'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t('common.saving') || 'جاري الحفظ...'}
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  {t('actions.save') || 'حفظ'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCaseModal;
