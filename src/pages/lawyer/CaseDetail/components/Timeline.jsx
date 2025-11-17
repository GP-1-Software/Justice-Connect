import React, { useState, useEffect } from 'react';
import { Clock, FileText, Upload, CheckCircle, Trash2, Maximize2 } from 'lucide-react';
import { supabase } from '../../../../supabaseClient';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';

const Timeline = ({ updates, caseData, onEventDeleted }) => {
  const { lawyer } = useLawyerAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enrichedUpdates, setEnrichedUpdates] = useState([]);

  useEffect(() => {
    if (updates) {
      enrichUpdatesWithAuthors();
    }
  }, [updates]);

  const enrichUpdatesWithAuthors = async () => {
    if (!updates || updates.length === 0) {
      setEnrichedUpdates([]);
      return;
    }

    try {
      const enriched = await Promise.all(
        updates.map(async (event) => {
          if (!event) return null;
          
          let authorName = 'النظام';
          
          try {
            if (event.author_type === 'client' && event.author_id) {
              const { data } = await supabase
                .from('users')
                .select('first_name, last_name')
                .eq('user_id', event.author_id)
                .eq('user_type', 'client')
                .single();
              
              if (data) {
                authorName = `${data.first_name} ${data.last_name} (عميل)`;
              }
            } else if (event.author_type === 'lawyer' && event.author_id) {
              const { data } = await supabase
                .from('lawyers')
                .select('first_name, last_name')
                .eq('lawyer_id', event.author_id)
                .single();
              
              if (data) {
                authorName = `${data.first_name} ${data.last_name} (محامي)`;
              }
            }
          } catch (error) {
            console.error('Error fetching author:', error);
          }

          return { ...event, authorName };
        })
      );

      setEnrichedUpdates(enriched.filter(e => e !== null));
    } catch (error) {
      console.error('Error enriching updates:', error);
      setEnrichedUpdates(updates || []);
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحدث؟')) return;
    try {
      const { error } = await supabase
        .from('timeline_events')
        .delete()
        .eq('event_id', eventId);

      if (error) throw error;
      
      // Update local state immediately
      setEnrichedUpdates(prev => prev.filter(e => e.event_id !== eventId));
      
      if (onEventDeleted) {
        onEventDeleted(eventId);
      }
      
      alert('تم حذف الحدث بنجاح');
    } catch (error) {
      console.error('Delete event error:', error.message);
      alert('حدث خطأ أثناء حذف الحدث');
    }
  };

  const getUpdateIcon = (eventType) => {
    const iconMap = {
      'note': FileText,
      'document': Upload,
      'file_upload': Upload,
      'status_change': CheckCircle,
      'case_created': CheckCircle,
      'meeting_created': Clock,
      'meeting_deleted': Clock,
      'task': CheckCircle,
      'default': Clock
    };
    return iconMap[eventType] || iconMap['default'];
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
  const validUpdates = enrichedUpdates.filter(event => event != null);
  
  const allEvents = [
    ...validUpdates,
    {
      event_id: 'case-created',
      id: 'case-created',
      title: 'تم إنشاء القضية',
      event_type: 'case_created',
      created_at: caseData?.created_at,
      authorName: 'النظام'
    }
  ]
  .filter(event => event != null && event.created_at)
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const INITIAL_DISPLAY_COUNT = 5;
  const displayedEvents = allEvents.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = allEvents.length > INITIAL_DISPLAY_COUNT;

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            الجدول الزمني
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {allEvents.length} {allEvents.length === 1 ? 'حدث' : 'أحداث'}
            </span>
            {hasMore && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group"
                title="عرض الجدول الزمني الكامل"
              >
                <Maximize2 className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

          <div className="space-y-6">
            {displayedEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                لا توجد تحديثات بعد
              </div>
            ) : (
              displayedEvents.map((event, index) => {
                const eventType = event?.event_type || event?.update_type || 'default';
                const Icon = getUpdateIcon(eventType);
                const eventId = event?.event_id || event?.id || `event-${index}`;
                const eventTitle = event?.title || event?.update_text || 'حدث';
                
                return (
                  <div key={eventId} className="relative flex items-start gap-4 pr-8">
                    <div className="absolute -right-2 flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full border-4 border-white dark:border-gray-800 z-10">
                      <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>

                    <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="text-gray-900 dark:text-white mb-2">
                        <div className="font-medium">{eventTitle}</div>
                        {event?.authorName && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            بواسطة: {event.authorName}
                          </div>
                        )}
                        {event?.description && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatDateTime(event?.created_at)}</span>
                        {eventId !== 'case-created' && event?.event_id && onEventDeleted && (
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

          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                عرض المزيد ({allEvents.length - INITIAL_DISPLAY_COUNT} أحداث إضافية)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">الجدول الزمني الكامل</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-4">
                {allEvents.map((event, index) => {
                  const eventType = event?.event_type || 'default';
                  const Icon = getUpdateIcon(eventType);
                  const eventId = event?.event_id || event?.id || `event-${index}`;
                  const eventTitle = event?.title || 'حدث';
                  
                  return (
                    <div key={eventId} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-shrink-0">
                          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{eventTitle}</div>
                          {event?.authorName && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              بواسطة: {event.authorName}
                            </div>
                          )}
                          {event?.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDateTime(event?.created_at)}
                            </div>
                            {eventId !== 'case-created' && event?.event_id && onEventDeleted && (
                              <button
                                onClick={() => {
                                  handleDelete(event.event_id);
                                  setIsModalOpen(false);
                                }}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي الأحداث: {allEvents.length}
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Timeline;
