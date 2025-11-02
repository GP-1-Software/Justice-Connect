import React, { useEffect, useState } from 'react';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';
import { Upload, File, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';

const LicenseUploader = () => {
  const { lawyer, setLawyer } = useLawyerAuth();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file || !lawyer) return;

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${lawyer.lawyer_id}/${docType}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lawyer-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('lawyer-documents')
        .getPublicUrl(fileName);

      // Update lawyer record with document URL
      const updateField = `${docType}_url`;
      const statusField = `${docType}_verification_status`;
      
      const { data, error } = await supabase
        .from('lawyers')
        .update({
          [updateField]: urlData.publicUrl,
          [statusField]: 'pending'
        })
        .eq('lawyer_id', lawyer.lawyer_id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local lawyer state and localStorage
      if (setLawyer && data) {
        setLawyer(data);
        // Also update localStorage to keep it in sync
        localStorage.setItem('user', JSON.stringify({ ...data, user_type: 'lawyer' }));
      }
      
      alert('تم رفع المستند بنجاح');
    } catch (error) {
      console.error('Upload error:', error.message);
      alert('حدث خطأ أثناء رفع المستند');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (docType) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستند؟')) return;
    try {
      // Extract file path from URL
      const urlField = `${docType}_url`;
      const fileUrl = lawyer[urlField];
      if (!fileUrl) return;

      const pathParts = fileUrl.split('/lawyer-documents/');
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('lawyer-documents')
          .remove([filePath]);

        if (storageError) console.warn('Storage delete warning:', storageError.message);
      }

      // Clear from database
      const updateField = `${docType}_url`;
      const statusField = `${docType}_verification_status`;
      
      const { data, error } = await supabase
        .from('lawyers')
        .update({
          [updateField]: null,
          [statusField]: null
        })
        .eq('lawyer_id', lawyer.lawyer_id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local lawyer state and localStorage
      if (setLawyer && data) {
        setLawyer(data);
        // Also update localStorage to keep it in sync
        localStorage.setItem('user', JSON.stringify({ ...data, user_type: 'lawyer' }));
      }
      
      alert('تم حذف المستند بنجاح');
    } catch (error) {
      console.error('Delete error:', error.message);
      alert('حدث خطأ أثناء حذف المستند');
    }
  };

  const getDocument = (type) => {
    if (!lawyer) return null;
    const urlField = `${type}_url`;
    const statusField = `${type}_verification_status`;
    
    if (!lawyer[urlField]) return null;
    
    return {
      url: lawyer[urlField],
      status: lawyer[statusField] || 'pending',
      uploaded_at: lawyer.updated_at
    };
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { 
        label: 'قيد المراجعة', 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: Loader2
      },
      'verified': { 
        label: 'موثق', 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle
      },
      'rejected': { 
        label: 'مرفوض', 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: XCircle
      }
    };
    const statusInfo = statusMap[status] || statusMap['pending'];
    const StatusIcon = statusInfo.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>
        <StatusIcon className="h-3 w-3" />
        {statusInfo.label}
      </span>
    );
  };

  const DocumentSection = ({ type, title, description }) => {
    const doc = getDocument(type);

    return (
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>

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
                <span className="text-sm text-gray-600 dark:text-gray-300">{doc ? 'استبدال المستند' : 'رفع مستند'}</span>
              </>
            )}
          </div>
          <input
            type="file"
            onChange={(e) => handleFileUpload(e, type)}
            disabled={uploading}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </label>

        {/* Document Display */}
        <div className="space-y-2">
          {!doc ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              لا توجد مستندات مرفوعة
            </p>
          ) : (
            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(doc.status)}
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      عرض المستند
                    </a>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(type)}
                className="text-red-600 hover:text-red-700 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          يرجى رفع المستندات المطلوبة للتحقق من هويتك المهنية. ستتم مراجعة المستندات من قبل الإدارة.
        </p>
      </div>

      <DocumentSection
        type="license"
        title="رخصة مزاولة المهنة"
        description="رخصة مزاولة مهنة المحاماة الصادرة من نقابة المحامين"
      />

      <DocumentSection
        type="certificate"
        title="الشهادات الأكاديمية"
        description="شهادة البكالوريوس في القانون أو الشهادات العليا"
      />

      <DocumentSection
        type="id_card"
        title="بطاقة الهوية الوطنية"
        description="بطاقة الهوية الوطنية سارية المفعول"
      />
    </div>
  );
};

export default LicenseUploader;
