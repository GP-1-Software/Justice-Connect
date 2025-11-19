import { useState, useEffect } from 'react';
import { MessageSquare, Lock, Unlock, Trash2, Send, Loader2, User } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { useClientAuth } from '../../../hooks/useClientAuth';

const CaseNotes = ({ caseId, caseStatus }) => {
  const { userProfile } = useClientAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingNoteId, setUpdatingNoteId] = useState(null);
  
  // التحقق من إمكانية إضافة ملاحظات
  const canAddNote = caseStatus === 'active';

  useEffect(() => {
    if (caseId && userProfile) {
      fetchNotes();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [caseId, userProfile]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      
      // Fetch client's own notes and shared lawyer notes
      const { data, error } = await supabase
        .from('case_notes')
        .select('*')
        .eq('case_id', caseId)
        .or(`and(created_by_type.eq.client,created_by_id.eq.${userProfile.user_id}),and(created_by_type.eq.lawyer,is_shared.eq.true)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch lawyer names for shared lawyer notes
      if (data && data.length > 0) {
        const lawyerNotes = data.filter(note => note.created_by_type === 'lawyer');
        const lawyerIds = [...new Set(lawyerNotes.map(note => note.created_by_id))];
        
        if (lawyerIds.length > 0) {
          const { data: lawyers } = await supabase
            .from('lawyers')
            .select('lawyer_id, first_name, last_name')
            .in('lawyer_id', lawyerIds);
          
          // Map lawyer info to notes
          const notesWithLawyers = data.map(note => {
            if (note.created_by_type === 'lawyer' && lawyers) {
              const lawyer = lawyers.find(l => l.lawyer_id === note.created_by_id);
              return { ...note, lawyer };
            }
            return note;
          });
          
          setNotes(notesWithLawyers);
        } else {
          setNotes(data);
        }
      } else {
        setNotes(data || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time Subscription
  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`case_notes_${caseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'case_notes',
          filter: `case_id=eq.${caseId}`
        },
        async (payload) => {
          console.log('New note added:', payload.new);
          // Fetch full note with lawyer info
          const { data } = await supabase
            .from('case_notes')
            .select(`
              *,
              lawyer:lawyers!case_notes_lawyer_id_fkey (
                lawyer_id,
                first_name,
                last_name,
                profile_image_url
              )
            `)
            .eq('note_id', payload.new.note_id)
            .single();
          
          if (data) {
            setNotes(prev => [data, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'case_notes',
          filter: `case_id=eq.${caseId}`
        },
        (payload) => {
          console.log('Note updated:', payload.new);
          setNotes(prev => 
            prev.map(note => 
              note.note_id === payload.new.note_id 
                ? { ...note, ...payload.new } 
                : note
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'case_notes',
          filter: `case_id=eq.${caseId}`
        },
        (payload) => {
          console.log('Note deleted:', payload.old);
          setNotes(prev => 
            prev.filter(note => note.note_id !== payload.old.note_id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // إضافة ملاحظة جديدة
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('case_notes')
        .insert({
          case_id: caseId,
          created_by_type: 'client',
          created_by_id: userProfile.user_id,
          content: newNote.trim(),
          is_shared: false
        });

      if (error) throw error;

      // إنشاء حدث في Timeline
      await supabase
        .from('timeline_events')
        .insert({
          case_id: caseId,
          event_type: 'note',
          author_id: userProfile.user_id,
          author_type: 'client',
          title: 'تمت إضافة ملاحظة',
          description: newNote.substring(0, 100) + (newNote.length > 100 ? '...' : ''),
          visibility: 'all'
        });

      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('حدث خطأ أثناء إضافة الملاحظة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // تبديل حالة المشاركة
  const handleToggleShared = async (noteId, currentShared) => {
    try {
      setUpdatingNoteId(noteId);

      // تحديث في الـ state مباشرة (Optimistic Update)
      setNotes(prev => 
        prev.map(note => 
          note.note_id === noteId 
            ? { ...note, is_shared: !currentShared } 
            : note
        )
      );

      const { error } = await supabase
        .from('case_notes')
        .update({ is_shared: !currentShared })
        .eq('note_id', noteId);

      if (error) {
        // إذا فشل التحديث، نرجع الحالة القديمة
        setNotes(prev => 
          prev.map(note => 
            note.note_id === noteId 
              ? { ...note, is_shared: currentShared } 
              : note
          )
        );
        throw error;
      }
    } catch (error) {
      console.error('Error toggling shared:', error);
      alert('حدث خطأ أثناء تحديث الملاحظة');
    } finally {
      setUpdatingNoteId(null);
    }
  };

  // حذف ملاحظة
  const handleDeleteNote = async (noteId) => {
    if (!confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return;

    try {
      // حذف من الـ state مباشرة (Optimistic Update)
      setNotes(prev => prev.filter(note => note.note_id !== noteId));

      const { error } = await supabase
        .from('case_notes')
        .delete()
        .eq('note_id', noteId);

      if (error) {
        // إذا فشل الحذف، نرجع الملاحظة
        fetchNotes();
        throw error;
      }

      // إنشاء حدث في Timeline
      await supabase
        .from('timeline_events')
        .insert({
          case_id: caseId,
          event_type: 'note',
          author_id: userProfile.user_id,
          author_type: 'client',
          title: 'تم حذف ملاحظة',
          description: 'تم حذف ملاحظة من القضية',
          visibility: 'all'
        });
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('حدث خطأ أثناء حذف الملاحظة');
    }
  };

  const isOwnNote = (note) => {
    return note.created_by_type === 'client' && 
           note.created_by_id === userProfile?.user_id;
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

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'منذ لحظات';
    if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
    if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
    if (diffInSeconds < 604800) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Add Note Form */}
      {canAddNote ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            إضافة ملاحظة جديدة
          </h3>
          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="اكتب ملاحظتك هنا... (ستكون خاصة بشكل افتراضي)"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none"
              rows="4"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                الملاحظة ستكون خاصة، يمكنك مشاركتها لاحقاً
              </p>
              <button
                type="submit"
                disabled={isSubmitting || !newNote.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    إضافة ملاحظة
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-yellow-900 dark:text-yellow-200 mb-1">
                لا يمكن إضافة ملاحظات حالياً
              </h4>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                يمكنك إضافة ملاحظات فقط بعد قبول المحامي للقضية
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
          <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">لا توجد ملاحظات</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {notes.map((note) => {
            const own = isOwnNote(note);
            const isLawyerNote = note.created_by_type === 'lawyer';
            
            return (
              <div
                key={note.note_id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 transition-all ${
                  isLawyerNote
                    ? 'border-yellow-200 dark:border-yellow-800'
                    : own
                    ? 'border-blue-200 dark:border-blue-800'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="p-4 sm:p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {isLawyerNote
                          ? `المحامي ${note.lawyer?.first_name || ''} ${note.lawyer?.last_name || ''}`
                          : 'أنت'
                        }
                      </span>
                      {/* Badge */}
                      {isLawyerNote ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                          من المحامي
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          note.is_shared
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {note.is_shared ? (
                            <>
                              <Unlock className="w-3 h-3" />
                              مشتركة
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" />
                              خاصة
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(note.created_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                    {note.content}
                  </p>

                  {/* Actions - Only for own notes */}
                  {own && (
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleToggleShared(note.note_id, note.is_shared)}
                        disabled={updatingNoteId === note.note_id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          note.is_shared
                            ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                            : 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300'
                        } disabled:opacity-50`}
                      >
                        {updatingNoteId === note.note_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : note.is_shared ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                        {note.is_shared ? 'جعلها خاصة' : 'مشاركة مع المحامي'}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteNote(note.note_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-xs font-medium transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CaseNotes;
