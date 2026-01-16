import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useClientAuth } from '../../hooks/useClientAuth';
import { FileText, Trash2, Download, Loader2, FolderOpen, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Documents = () => {
    const { userProfile } = useClientAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);

    // Fetch all documents from user's cases
    const fetchDocuments = async () => {
        try {
            setLoading(true);

            // First get user's cases
            const { data: cases, error: casesError } = await supabase
                .from('cases')
                .select('case_id, title')
                .or(`client_id.eq.${userProfile.user_id},client_id_number.eq.${userProfile.id_number}`);

            if (casesError) throw casesError;

            if (!cases || cases.length === 0) {
                setDocuments([]);
                return;
            }

            const caseIds = cases.map(c => c.case_id);

            // Fetch all files from these cases
            const { data: files, error: filesError } = await supabase
                .from('case_files')
                .select('*')
                .in('case_id', caseIds)
                .order('created_at', { ascending: false });

            if (filesError) throw filesError;

            // Merge with case titles
            const docsWithCaseInfo = (files || []).map(file => ({
                ...file,
                case_title: cases.find(c => c.case_id === file.case_id)?.title || 'قضية غير معروفة'
            }));

            setDocuments(docsWithCaseInfo);
        } catch (err) {
            console.error('Error fetching documents:', err);
            toast.error('حدث خطأ في جلب المستندات');
        } finally {
            setLoading(false);
        }
    };

    // Delete document
    const handleDelete = async (file) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستند؟')) return;

        setDeleting(file.file_id);
        try {
            // Delete from storage if URL exists
            if (file.file_url) {
                const path = file.file_url.split('/case-documents/')[1];
                if (path) {
                    await supabase.storage.from('case-documents').remove([path]);
                }
            }

            // Delete from database
            const { error } = await supabase
                .from('case_files')
                .delete()
                .eq('file_id', file.file_id);

            if (error) throw error;

            setDocuments(prev => prev.filter(d => d.file_id !== file.file_id));
            toast.success('تم حذف المستند بنجاح');
        } catch (err) {
            console.error('Error deleting file:', err);
            toast.error('حدث خطأ في حذف المستند');
        } finally {
            setDeleting(null);
        }
    };

    // Format file size
    const formatSize = (bytes) => {
        if (!bytes) return '-';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    useEffect(() => {
        if (userProfile?.user_id) {
            fetchDocuments();
        }
    }, [userProfile]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">جاري تحميل المستندات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">مستنداتي</h1>
                    <p className="text-gray-600 dark:text-gray-400">جميع المستندات المرفوعة في قضاياك</p>
                </div>

                {/* Documents List */}
                {documents.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                        <FolderOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">لا توجد مستندات</h3>
                        <p className="text-gray-600 dark:text-gray-400">لم يتم رفع أي مستندات في قضاياك بعد</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                إجمالي المستندات: <span className="font-bold text-blue-600">{documents.length}</span>
                            </p>
                        </div>

                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {documents.map((doc) => (
                                <div
                                    key={doc.file_id}
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* File Icon */}
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg flex-shrink-0">
                                            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>

                                        {/* File Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                {doc.file_name}
                                            </h3>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                <span>القضية: {doc.case_title}</span>
                                                <span>الحجم: {formatSize(doc.file_size)}</span>
                                                <span>{new Date(doc.created_at).toLocaleDateString('ar-EG')}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {doc.file_url && (
                                                <a
                                                    href={doc.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="تحميل"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleDelete(doc)}
                                                disabled={deleting === doc.file_id}
                                                className="p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                                title="حذف"
                                            >
                                                {deleting === doc.file_id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Documents;
