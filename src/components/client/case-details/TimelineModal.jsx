import { X, Clock, FileText, Calendar, AlertCircle, CheckCircle2, Filter } from 'lucide-react';
import { useState } from 'react';

const TimelineModal = ({ isOpen, onClose, events, caseTitle }) => {
  const [filter, setFilter] = useState('all');

  if (!isOpen) return null;

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

  const filteredEvents = filter === 'all' 
    ? events 
    : filter === 'task'
      ? events.filter(event => ['task', 'task_done', 'task_del'].includes(event.event_type))
      : events.filter(event => event.event_type === filter);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">الجدول الزمني الكامل</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{caseTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Filter */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">تصفية الأحداث</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setFilter(type.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

        {/* Timeline Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Clock className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">لا توجد أحداث</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute right-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600"></div>

              {/* Events */}
              <div className="space-y-6">
                {filteredEvents.map((event, index) => {
                  const EventIcon = getEventIcon(event.event_type);
                  const eventColor = getEventColor(event.event_type);
                  const isLast = index === filteredEvents.length - 1;

                  // Use the authorName from the enriched event
                  const authorName = event.authorName || 'النظام';

                  return (
                    <div 
                      key={event.event_id} 
                      className={`relative pr-12 ${
                        !isLast ? 'pb-6 border-b border-gray-100 dark:border-gray-700/50' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div className={`absolute right-0 w-10 h-10 rounded-full border-2 ${eventColor} flex items-center justify-center shadow-lg z-10`}>
                        <EventIcon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/30 rounded-lg p-4 hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                              {event.title}
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${eventColor}`}>
                                {getEventTypeLabel(event.event_type)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                بواسطة: <span className="font-medium text-gray-700 dark:text-gray-300">{authorName}</span>
                              </span>
                            </div>
                          </div>
                          <div className="text-left flex-shrink-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(event.created_at)}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {formatTime(event.created_at)}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
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
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            إجمالي الأحداث: {filteredEvents.length}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition font-medium"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineModal;
