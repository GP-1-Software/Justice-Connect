import { useState, useEffect, useRef } from 'react';
import { FileText, Download, Eye, Upload, File, Image, FileVideo, FileArchive, Calendar, User, HardDrive, X, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { useClientAuth } from '../../../hooks/useClientAuth';

const CaseFiles = ({ caseId }) => {
  const { userProfile } = useClientAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (caseId) {
      fetchFiles();
    }
  }, [caseId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('case_files')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return File;
    
    if (fileType.includes('image')) return Image;
    if (fileType.includes('video')) return FileVideo;
    if (fileType.includes('pdf')) return FileText;
    if (fileType.includes('zip') || fileType.includes('rar')) return FileArchive;
    return File;
  };

  const getFileColor = (fileType) => {
    if (!fileType) return 'text-gray-600 dark:text-gray-400';
    
    if (fileType.includes('image')) return 'text-blue-600 dark:text-blue-400';
    if (fileType.includes('video')) return 'text-purple-600 dark:text-purple-400';
    if (fileType.includes('pdf')) return 'text-red-600 dark:text-red-400';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
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

  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleFileUpload = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    if (!userProfile || !userProfile.user_id) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `case-files/${caseId}/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('case-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('case-documents')
          .getPublicUrl(filePath);

        // Save file info to database
        const { error: dbError } = await supabase
          .from('case_files')
          .insert({
            case_id: caseId,
            uploaded_by: userProfile.user_id,
            uploader_type: 'client',
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size
          });

        if (dbError) throw dbError;

        // Create timeline event for file upload
        await supabase
          .from('timeline_events')
          .insert({
            case_id: caseId,
            event_type: 'file_upload',
            author_id: userProfile.user_id,
            author_type: 'client',
            title: 'تم رفع ملف جديد',
            description: `تم رفع الملف: ${file.name}`,
            visibility: 'all'
          });

        // Update progress
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      // Refresh files list
      await fetchFiles();
      alert('تم رفع الملفات بنجاح!');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('حدث خطأ أثناء رفع الملفات: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDeleteFile = async (fileId, fileName) => {
    if (!confirm(`هل أنت متأكد من حذف الملف: ${fileName}؟`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('case_files')
        .delete()
        .eq('file_id', fileId);

      if (error) throw error;

      // Create timeline event for file deletion
      await supabase
        .from('timeline_events')
        .insert({
          case_id: caseId,
          event_type: 'file_upload',
          author_id: userProfile.user_id,
          author_type: 'client',
          title: 'تم حذف ملف',
          description: `تم حذف الملف: ${fileName}`,
          visibility: 'all'
        });

      await fetchFiles();
      alert('تم حذف الملف بنجاح');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('حدث خطأ أثناء حذف الملف');
    }
  };

  const totalSize = files.reduce((acc, file) => acc + (file.file_size || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Upload Section - Compact */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">رفع ملفات جديدة</h3>
        </div>

        {/* Compact Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.rar"
          />

          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                جاري الرفع... {uploadProgress}%
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              <div className="text-right flex-1">
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                  اسحب الملفات أو اضغط للاختيار
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                  PDF, Word, صور, ZIP
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-xs sm:text-sm whitespace-nowrap"
              >
                اختر ملفات
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 rounded-lg sm:rounded-xl border border-blue-100 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">إجمالي الملفات</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{files.length}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-lg sm:rounded-xl border border-purple-100 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">الحجم الكلي</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{formatFileSize(totalSize)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 rounded-lg sm:rounded-xl border border-green-100 dark:border-gray-700 p-3 sm:p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">آخر رفع</span>
          </div>
          <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
            {files.length > 0 ? formatDate(files[0].created_at) : 'لا يوجد'}
          </p>
        </div>
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
          <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">لا توجد ملفات مرفقة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {files.map((file) => {
            const FileIcon = getFileIcon(file.file_type);
            const fileColor = getFileColor(file.file_type);

            return (
              <div
                key={file.file_id}
                className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all overflow-hidden group"
              >
                {/* File Preview/Icon */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-6 sm:p-8 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
                  <FileIcon className={`w-12 h-12 sm:w-16 sm:h-16 ${fileColor}`} />
                </div>

                {/* File Info */}
                <div className="p-3 sm:p-4">
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {file.file_name}
                  </h4>

                  {file.description && (
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {file.description}
                    </p>
                  )}

                  {/* File Meta */}
                  <div className="space-y-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>الحجم</span>
                      <span className="font-medium">{formatFileSize(file.file_size)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>التاريخ</span>
                      <span className="font-medium">{formatDate(file.created_at)}</span>
                    </div>
                    {file.uploader_type && (
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>رفع بواسطة</span>
                        <span className="font-medium">
                          {file.uploader_type === 'lawyer' ? 'المحامي' : 'العميل'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 px-2 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium"
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">عرض</span>
                    </a>
                    <button
                      onClick={() => handleDownload(file.file_url, file.file_name)}
                      className="flex items-center justify-center gap-1 px-2 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                    >
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">تحميل</span>
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.file_id, file.file_name)}
                      className="flex items-center justify-center gap-1 px-2 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                      title="حذف الملف"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">حذف</span>
                    </button>
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

export default CaseFiles;
