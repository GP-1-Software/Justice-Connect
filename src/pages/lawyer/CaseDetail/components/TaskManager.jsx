import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';
import { CheckSquare, Plus, Trash2, Square } from 'lucide-react';

const TaskManager = ({ caseId }) => {
  const { t } = useTranslation();
  const { lawyer } = useLawyerAuth();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadTasks() {
      if (!lawyer || !caseId) return;
      try {
        const { data, error } = await supabase
          .from('case_tasks')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (mounted) setTasks(data || []);
      } catch (error) {
        console.warn('Tasks load error:', error.message);
        if (mounted) setTasks([]);
      }
    }
    loadTasks();
    return () => { mounted = false; };
  }, [lawyer, caseId]);

  const handleAddTask = async () => {
    if (!newTask.trim() || !lawyer) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('case_tasks')
        .insert([
          {
            case_id: caseId,
            lawyer_id: lawyer.lawyer_id,
            title: newTask.trim(),
            is_completed: false
          }
        ])
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => [data, ...prev]);
      setNewTask('');
    } catch (error) {
      console.error('Add task error:', error.message);
      alert(t('cases.taskError') || 'حدث خطأ أثناء إضافة المهمة');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('case_tasks')
        .update({ is_completed: !currentStatus })
        .eq('task_id', taskId);

      if (error) throw error;
      setTasks(prev => prev.map(t => t.task_id === taskId ? { ...t, is_completed: !currentStatus } : t));
    } catch (error) {
      console.error('Toggle task error:', error.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('case_tasks')
        .delete()
        .eq('task_id', taskId);

      if (error) throw error;
      setTasks(prev => prev.filter(t => t.task_id !== taskId));
    } catch (error) {
      console.error('Delete task error:', error.message);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckSquare className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {t('cases.tasks') || 'المهام'}
        </h3>
      </div>

      {/* Add Task */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
          placeholder={t('cases.addTaskPlaceholder') || 'أضف مهمة جديدة...'}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />
        <button
          onClick={handleAddTask}
          disabled={!newTask.trim() || loading}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            {t('cases.noTasks') || 'لا توجد مهام'}
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.task_id}
              className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group"
            >
              <button
                onClick={() => handleToggleTask(task.task_id, task.is_completed)}
                className="flex-shrink-0"
              >
                {task.is_completed ? (
                  <CheckSquare className="h-5 w-5 text-green-600" />
                ) : (
                  <Square className="h-5 w-5 text-gray-400" />
                )}
              </button>
              <span
                className={`flex-1 text-sm ${
                  task.is_completed
                    ? 'line-through text-gray-500 dark:text-gray-400'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {task.title}
              </span>
              <button
                onClick={() => handleDeleteTask(task.task_id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskManager;
