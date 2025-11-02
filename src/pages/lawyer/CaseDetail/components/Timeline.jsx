import React from 'react';
import { Clock, FileText, Upload, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../../../supabaseClient';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';

const Timeline = ({ updates, caseData, onEventDeleted }) => {
  const { lawyer } = useLawyerAuth();

  const handleDelete = async (eventId) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحدث؟')) return;
    try {
      const { error } = await supabase
        .from('timeline_events')
        .delete()
        .eq('event_id', eventId);

      if (error) throw error;
      
      // Call the callback to update parent state
      if (onEventDeleted) {
        onEventDeleted(eventId);
      }
      
      alert('تم حذف الحدث بنجاح');
    } catch (error) {
      console.error('Delete event error:', error.message);
      alert('حدث خطأ أثناء حذف الحدث');
    }
  };

  const getUpdateIcon = (updateType) => {
    const iconMap = {
      'note': FileText,
      'document': Upload,
      'status_change': CheckCircle,
      'default': Clock
    };
    return iconMap[updateType] || iconMap['default'];
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Combine case creation with updates
  const allEvents = [
    ...updates,
    {
      id: 'case-created',
      update_text: 'تم إنشاء القضية',
      update_type: 'status_change',
      created_at: caseData.created_at
    }
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
        الجدول الزمني
      </h3>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

        {/* Timeline Events */}
        <div className="space-y-6">
          {allEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              لا توجد تحديثات بعد
            </div>
          ) : (
            allEvents.map((event, index) => {
              const Icon = getUpdateIcon(event.update_type);
              return (
                <div key={event.id || index} className="relative flex items-start gap-4 pr-8">
                  {/* Icon */}
                  <div className="absolute -right-2 flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full border-4 border-white dark:border-gray-800 z-10">
                    <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-gray-900 dark:text-white mb-2">
                      <div className="font-medium">{event.title || event.update_text}</div>
                      {event.description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatDateTime(event.created_at)}</span>
                      {event.id !== 'case-created' && event.author_id === lawyer?.lawyer_id && (
                        <button
                          onClick={() => handleDelete(event.event_id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
