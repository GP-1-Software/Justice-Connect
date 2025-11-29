import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, Calendar, Filter, Loader2 } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { notifyTaskCompleted } from '../../../services/notificationService';

const CaseTasks = ({ caseId, canPerformAction, isDisabled }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (caseId) {
      fetchTasks();
    }
  }, [caseId, filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('case_tasks')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (filter === 'completed') {
        query = query.eq('is_completed', true);
      } else if (filter === 'pending') {
        query = query.eq('is_completed', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      'low': {
        label: 'منخفضة',
        color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      },
      'medium': {
        label: 'متوسطة',
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      },
      'high': {
        label: 'عالية',
        color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      },
      'urgent': {
        label: 'عاجلة',
        color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      }
    };
    return configs[priority] || configs['medium'];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    // التحقق من إمكانية التعديل
    if (!canPerformAction('تحديث حالة المهمة')) {
      return;
    }

    try {
      setUpdatingTaskId(taskId);

      // Get task details first
      const { data: taskData } = await supabase
        .from('case_tasks')
        .select('title, case_id')
        .eq('task_id', taskId)
        .single();

      const { error } = await supabase
        .from('case_tasks')
        .update({
          is_completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('task_id', taskId);

      if (error) throw error;

      // Create timeline event
      if (taskData && !currentStatus) {
        await supabase
          .from('timeline_events')
          .insert({
            case_id: taskData.case_id,
            event_type: 'task',
            author_id: null,
            author_type: 'client',
            title: 'تم إكمال مهمة',
            description: `تم إكمال المهمة: ${taskData.title}`,
            visibility: 'all'
          });

        // Send notification to lawyer
        try {
          const { data: caseInfo } = await supabase
            .from('cases')
            .select('assigned_lawyer_id, title')
            .eq('case_id', taskData.case_id)
            .single();

          if (caseInfo && caseInfo.assigned_lawyer_id) {
            await notifyTaskCompleted(
              caseInfo.assigned_lawyer_id,
              'lawyer',
              caseInfo.title || 'بدون عنوان',
              taskData.title,
              taskData.case_id
            );
          }
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }

      // Refresh tasks
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('حدث خطأ أثناء تحديث المهمة');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const completedTasks = tasks.filter(task => task.is_completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Progress Card */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md border border-blue-100 dark:border-gray-700 p-4 sm:p-5 lg:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">تقدم المهام</h3>
          <span className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 sm:h-4 mb-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-500 h-3 sm:h-4 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <span>{completedTasks} مكتملة</span>
          <span>{totalTasks - completedTasks} قيد التنفيذ</span>
          <span>المجموع: {totalTasks}</span>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">تصفية المهام</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${filter === 'all'
              ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            الكل ({totalTasks})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${filter === 'pending'
              ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            قيد التنفيذ ({totalTasks - completedTasks})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${filter === 'completed'
              ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            مكتملة ({completedTasks})
          </button>
        </div>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
          <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">لا توجد مهام</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {tasks.map((task) => {
            const priority = getPriorityConfig(task.priority);
            const overdue = !task.is_completed && isOverdue(task.due_date);

            return (
              <div
                key={task.task_id}
                className={`bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md border-2 transition-all hover:shadow-lg ${task.is_completed
                  ? 'border-green-200 dark:border-green-800 opacity-75'
                  : overdue
                    ? 'border-red-200 dark:border-red-800'
                    : 'border-gray-200 dark:border-gray-700'
                  }`}
              >
                <div className="p-3 sm:p-4 lg:p-5">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <button
                      onClick={() => handleToggleTask(task.task_id, task.is_completed)}
                      disabled={updatingTaskId === task.task_id || isDisabled}
                      className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      title={isDisabled ? 'القضية معطلة' : (task.is_completed ? 'إلغاء الإكمال' : 'تحديد كمكتملة')}
                    >
                      {updatingTaskId === task.task_id ? (
                        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                      ) : task.is_completed ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-600 hover:text-blue-600 dark:hover:text-blue-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm sm:text-base font-bold mb-2 ${task.is_completed
                        ? 'text-gray-500 dark:text-gray-400 line-through'
                        : 'text-gray-900 dark:text-white'
                        }`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${priority.color}`}>
                      {priority.label}
                    </span>

                    {task.due_date && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${overdue
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                        <Calendar className="w-3 h-3" />
                        {formatDate(task.due_date)}
                        {overdue && <AlertCircle className="w-3 h-3" />}
                      </span>
                    )}

                    {task.is_completed && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        <CheckCircle2 className="w-3 h-3" />
                        مكتملة
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CaseTasks;
