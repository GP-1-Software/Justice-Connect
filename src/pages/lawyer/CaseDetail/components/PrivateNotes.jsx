import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';
import { StickyNote, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

const PrivateNotes = ({ caseId }) => {
  const { t } = useTranslation();
  const { lawyer } = useLawyerAuth();
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadNotes() {
      if (!lawyer || !caseId) return;
      try {
        const { data, error } = await supabase
          .from('case_notes')
          .select('*')
          .eq('case_id', caseId)
          .eq('lawyer_id', lawyer.lawyer_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (mounted) setNotes(data || []);
      } catch (error) {
        console.warn('Notes load error:', error.message);
        if (mounted) setNotes([]);
      }
    }
    loadNotes();
    return () => { mounted = false; };
  }, [lawyer, caseId]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !lawyer) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('case_notes')
        .insert([
          {
            case_id: caseId,
            lawyer_id: lawyer.lawyer_id,
            content: newNote.trim()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      setNotes(prev => [data, ...prev]);
      setNewNote('');
    } catch (error) {
      console.error('Add note error:', error.message);
      alert(t('cases.noteError') || 'حدث خطأ أثناء إضافة الملاحظة');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (noteId) => {
    if (!editText.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('case_notes')
        .update({ content: editText.trim() })
        .eq('note_id', noteId);

      if (error) throw error;
      setNotes(prev => prev.map(n => n.note_id === noteId ? { ...n, content: editText.trim() } : n));
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Edit note error:', error.message);
      alert(t('cases.noteError') || 'حدث خطأ أثناء تعديل الملاحظة');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!confirm(t('cases.confirmDelete') || 'هل أنت متأكد من حذف هذه الملاحظة؟')) return;
    try {
      const { error } = await supabase
        .from('case_notes')
        .delete()
        .eq('note_id', noteId);

      if (error) throw error;
      setNotes(prev => prev.filter(n => n.note_id !== noteId));
    } catch (error) {
      console.error('Delete note error:', error.message);
      alert(t('cases.deleteError') || 'حدث خطأ أثناء حذف الملاحظة');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <StickyNote className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {t('cases.privateNotes') || 'ملاحظات خاصة'}
        </h3>
      </div>

      {/* Add Note */}
      <div className="mb-4">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={t('cases.addNotePlaceholder') || 'أضف ملاحظة خاصة...'}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
          rows={3}
        />
        <button
          onClick={handleAddNote}
          disabled={!newNote.trim() || loading}
          className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm"
        >
          <Plus className="h-4 w-4" />
          {t('cases.addNote') || 'إضافة'}
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            {t('cases.noNotes') || 'لا توجد ملاحظات'}
          </p>
        ) : (
          notes.map((note) => (
            <div key={note.note_id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
              {editingId === note.note_id ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(note.note_id)}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      <Save className="h-3 w-3" />
                      {t('actions.save') || 'حفظ'}
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditText(''); }}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                    >
                      <X className="h-3 w-3" />
                      {t('actions.cancel') || 'إلغاء'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{note.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {new Date(note.created_at).toLocaleDateString('ar-EG')}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingId(note.note_id); setEditText(note.content); }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.note_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PrivateNotes;
