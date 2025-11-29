import React, { useState } from 'react';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';
import { Send, Loader2 } from 'lucide-react';
import { notifyTimelineUpdate } from '../../../../services/notificationService';

const UpdateComposer = ({ caseId, onUpdateAdded }) => {
  const { lawyer } = useLawyerAuth();
  const [updateText, setUpdateText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!updateText.trim() || !lawyer) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .insert([
          {
            case_id: caseId,
            event_type: 'update',
            author_id: lawyer.lawyer_id,
            author_type: 'lawyer',
            title: 'تحديث القضية',
            description: updateText.trim(),
            visibility: 'all'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Update the case's updated_at timestamp
      await supabase
        .from('cases')
        .update({ updated_at: new Date().toISOString() })
        .eq('case_id', caseId);

      // Send notification to client
      try {
        const { data: caseData } = await supabase
          .from('cases')
          .select('client_id, title')
          .eq('case_id', caseId)
          .single();

        if (caseData && caseData.client_id) {
          await notifyTimelineUpdate(
            caseData.client_id,
            'client',
            caseData.title || 'بدون عنوان',
            updateText.trim(),
            caseId
          );
        }
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }

      setUpdateText('');
      if (onUpdateAdded) onUpdateAdded(data);
    } catch (error) {
      console.error('Update submission error:', error.message);
      alert('حدث خطأ أثناء إضافة التحديث');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        إضافة تحديث
      </h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={updateText}
          onChange={(e) => setUpdateText(e.target.value)}
          placeholder="اكتب تحديثًا للقضية (مثال: تم تقديم المذكرة للمحكمة)..."
          className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          rows={4}
          disabled={loading}
        />
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={!updateText.trim() || loading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                نشر التحديث
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateComposer;
