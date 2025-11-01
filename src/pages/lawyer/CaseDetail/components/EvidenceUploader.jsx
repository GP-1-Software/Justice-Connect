import React, { useEffect, useState } from 'react';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';
import { Upload, File, Download, Trash2, Loader2 } from 'lucide-react';

const EvidenceUploader = ({ caseId }) => {
  const { lawyer } = useLawyerAuth();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadDocuments() {
      if (!lawyer || !caseId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('case_files')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (mounted) setDocuments(data || []);
      } catch (error) {
        console.warn('Documents load error:', error.message);
        if (mounted) setDocuments([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDocuments();
    return () => { mounted = false; };
  }, [lawyer, caseId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !lawyer) return;

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${caseId}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('case-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('case-documents')
        .getPublicUrl(fileName);

      // Save document record
      const { data, error } = await supabase
        .from('case_files')
        .insert([
          {
            case_id: caseId,
            uploaded_by: lawyer.lawyer_id,
            uploader_type: 'lawyer',
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_type: file.type,
            file_size: file.size,
            description: `Uploaded by ${lawyer.full_name || 'Lawyer'}`
          }
        ])
        .select()
        .single();

      if (error) throw error;
      setDocuments(prev => [data, ...prev]);
    } catch (error) {
      console.error('Upload error:', error.message);
      alert('حدث خطأ أثناء رفع الملف');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (doc) => {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('case-documents')
        .remove([doc.file_path]);

      if (storageError) console.warn('Storage delete warning:', storageError.message);

      // Delete record
      const { error } = await supabase
        .from('case_files')
        .delete()
        .eq('file_id', doc.file_id);

      if (error) throw error;
      setDocuments(prev => prev.filter(d => d.file_id !== doc.file_id));
    } catch (error) {
      console.error('Delete error:', error.message);
      alert('حدث خطأ أثناء حذف الملف');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          الأدلة والمستندات
        </h3>
      </div>

      {/* Upload Button */}
      <label className="block mb-4">
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-300">جاري الرفع...</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-300">رفع ملف</span>
            </>
          )}
        </div>
        <input
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
        />
      </label>

      {/* Documents List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            جاري التحميل...
          </div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            لا توجد مستندات
          </p>
        ) : (
          documents.map((doc) => (
            <div key={doc.file_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 dark:text-white truncate">{doc.file_name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(doc.file_size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => handleDelete(doc)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EvidenceUploader;
