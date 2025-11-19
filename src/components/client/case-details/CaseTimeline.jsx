import { useState, useEffect } from 'react';
import { Clock, FileText, Calendar, Scale, AlertCircle, CheckCircle2, User, Download, Eye, Filter, Maximize2 } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import TimelineModal from './TimelineModal';

const CaseTimeline = ({ caseId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [caseTitle, setCaseTitle] = useState('');

  useEffect(() => {
    if (caseId) {
      fetchTimelineEvents();
      fetchCaseTitle();
    }
  }, [caseId, filter]);

  const fetchCaseTitle = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('title')
        .eq('case_id', caseId)
        .single();

      if (error) throw error;
      setCaseTitle(data?.title || '');
    } catch (error) {
      console.error('Error fetching case title:', error);
    }
  };

  const fetchTimelineEvents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('timeline_events')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        // For task filter, include all task-related event types
        if (filter === 'task') {
          query = query.in('event_type', ['task', 'task_done', 'task_del']);
        } else {
          query = query.eq('event_type', filter);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch author information separately
      const eventsWithAuthors = await Promise.all(
        (data || []).map(async (event) => {
          let authorName = 'النظام';
          
          if (event.author_type === 'client' && event.author_id) {
            const { data: client } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('user_id', event.author_id)
              .single();
            
            if (client) {
              authorName = `${client.first_name} ${client.last_name}`;
            }
          } else if (event.author_type === 'lawyer' && event.author_id) {
            const { data: lawyer } = await supabase
              .from('lawyers')
              .select('first_name, last_name')
              .eq('lawyer_id', event.author_id)
              .single();
            
            if (lawyer) {
              authorName = `${lawyer.first_name} ${lawyer.last_name}`;
            }
          }
          
          return {
            ...event,
            authorName
          };
        })
      );

      setEvents(eventsWithAuthors);
    } catch (error) {
      console.error('Error fetching timeline events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType) => {
    const icons = {
      'hearing': Calendar,
      'document': FileText,
      'status_change': AlertCircle,
      'note': FileText,
      'task': CheckCircle2,
      'task_done': CheckCircle2,
      'task_del': AlertCircle,
      'file_upload': FileText
    };
    return icons[eventType] || Clock;
  };

  const getEventColor = (eventType) => {
    const colors = {
      'hearing': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      'document': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      'status_change': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      'note': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
      'task': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
      'task_done': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      'task_del': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
      'file_upload': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
    };
    return colors[eventType] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600';
  };

  const getEventTypeLabel = (eventType) => {
    const labels = {
      'hearing': 'جلسة',
      'document': 'مستند',
      'status_change': 'تغيير حالة',
      'note': 'ملاحظة',
      'task': 'مهمة',
      'task_done': 'إنجاز مهمة',
      'task_del': 'حذف مهمة',
      'file_upload': 'رفع ملف'
    };
    return labels[eventType] || eventType;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const eventTypes = [
    { value: 'all', label: 'الكل' },
    { value: 'hearing', label: 'الجلسات' },
    { value: 'document', label: 'المستندات' },
    { value: 'status_change', label: 'تغييرات الحالة' },
    { value: 'note', label: 'الملاحظات' },
    { value: 'task', label: 'المهام' },
    { value: 'file_upload', label: 'الملفات' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  const INITIAL_DISPLAY_COUNT = 5;
  const displayedEvents = showAll ? events : events.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = events.length > INITIAL_DISPLAY_COUNT;

  const handleToggleShowAll = () => {
    setIsExpanding(true);
    setShowAll(!showAll);
    setTimeout(() => setIsExpanding(false), 300);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">تصفية الأحداث</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {eventTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilter(type.value)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                filter === type.value
                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {events.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
          <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">لا توجد أحداث في الجدول الزمني</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-5 lg:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-700/50 dark:to-gray-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">الأحداث الأخيرة</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {events.length} {events.length === 1 ? 'حدث' : 'أحداث'}
                </span>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group"
                  title="عرض الجدول الزمني الكامل"
                >
                  <Maximize2 className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Container with Fixed Height */}
          <div 
            className={`relative overflow-y-auto transition-all duration-300 ${
              isExpanding ? 'opacity-75' : 'opacity-100'
            }`}
            style={{
              maxHeight: showAll ? '600px' : '350px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 transparent'
            }}
          >
            {/* Custom Scrollbar Styles */}
            <style>{`
              .timeline-scroll::-webkit-scrollbar {
                width: 6px;
              }
              .timeline-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              .timeline-scroll::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
              }
              .timeline-scroll::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
              .dark .timeline-scroll::-webkit-scrollbar-thumb {
                background: #475569;
              }
              .dark .timeline-scroll::-webkit-scrollbar-thumb:hover {
                background: #64748b;
              }
            `}</style>
            
            <div className="timeline-scroll p-4 sm:p-5 lg:p-6">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute right-[19px] sm:right-[23px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600"></div>

                {/* Events */}
                <div className="space-y-6 sm:space-y-8">
                  {displayedEvents.map((event, index) => {
                    const EventIcon = getEventIcon(event.event_type);
                    const eventColor = getEventColor(event.event_type);
                    const isLast = index === displayedEvents.length - 1;
                    
                    // Use the authorName from the enriched event
                    const authorName = event.authorName || 'النظام';

                    return (
                      <div 
                        key={event.event_id} 
                        className={`relative pr-12 sm:pr-16 ${
                          !isLast ? 'pb-6 sm:pb-8 border-b border-gray-100 dark:border-gray-700/50' : ''
                        }`}
                      >
                        {/* Icon */}
                        <div className={`absolute right-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 ${eventColor} flex items-center justify-center shadow-lg z-10`}>
                          <EventIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>

                        {/* Content */}
                        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/30 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${eventColor}`}>
                                  {getEventTypeLabel(event.event_type)}
                                </span>
                                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                  بواسطة: <span className="font-medium text-gray-700 dark:text-gray-300">{authorName}</span>
                                </span>
                              </div>
                            </div>
                            <div className="text-left flex-shrink-0">
                              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(event.created_at)}
                              </p>
                              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
                                {formatTime(event.created_at)}
                              </p>
                            </div>
                          </div>

                          {/* Description */}
                          {event.description && (
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                              {event.description}
                            </p>
                          )}

                          {/* Files */}
                          {event.files && Array.isArray(event.files) && event.files.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">الملفات المرفقة:</p>
                              <div className="flex flex-wrap gap-2">
                                {event.files.map((file, fileIndex) => (
                                  <a
                                    key={fileIndex}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-xs"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Fade Gradient at Bottom */}
            {!showAll && hasMore && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none"></div>
            )}
          </div>

          {/* Show More/Less Button */}
          {hasMore && (
            <div className="px-4 sm:px-5 lg:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
              <button
                onClick={handleToggleShowAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-all text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600"
              >
                <Clock className="w-4 h-4" />
                <span>
                  {showAll 
                    ? 'عرض أقل' 
                    : `عرض المزيد (${events.length - INITIAL_DISPLAY_COUNT} أحداث إضافية)`
                  }
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-300 ${
                    showAll ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Timeline Modal */}
      <TimelineModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        events={events}
        caseTitle={caseTitle}
      />
    </div>
  );
};

export default CaseTimeline;
