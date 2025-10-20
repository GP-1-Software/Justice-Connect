import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';
import { Upload, File, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';

const LicenseUploader = () => {
  const { t } = useTranslation();
  const { lawyer } = useLawyerAuth();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadDocuments() {
      if (!lawyer) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lawyer_documents')
          .select('*')
          .eq('lawyer_id', lawyer.lawyer_id)
          .order('uploaded_at', { ascending: false });

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
  }, [lawyer]);

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

      // Save document record
      const { data, error } = await supabase
        .from('lawyer_documents')
        .insert([
          {
            lawyer_id: lawyer.lawyer_id,
            document_type: docType,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_path: fileName,
            verification_status: 'pending',
            uploaded_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      setDocuments(prev => [data, ...prev]);
      alert(t('profile.uploadSuccess') || 'تم رفع المستند بنجاح');
    } catch (error) {
      console.error('Upload error:', error.message);
      alert(t('profile.uploadError') || 'حدث خطأ أثناء رفع المستند');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (doc) => {
    if (!confirm(t('profile.confirmDelete') || 'هل أنت متأكد من حذف هذا المستند؟')) return;
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('lawyer-documents')
        .remove([doc.file_path]);

      if (storageError) console.warn('Storage delete warning:', storageError.message);

      // Delete record
      const { error } = await supabase
        .from('lawyer_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (error) {
      console.error('Delete error:', error.message);
      alert(t('profile.deleteError') || 'حدث خطأ أثناء حذف المستند');
    }
  };

  const getDocumentsByType = (type) => {
    return documents.filter(d => d.document_type === type);
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
    return statusMap[status] || statusMap['pending'];
  };

  const DocumentSection = ({ type, title, description }) => {
    const docs = getDocumentsByType(type);

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
                <span className="text-sm text-gray-600 dark:text-gray-300">{t('common.uploading') || 'جاري الرفع...'}</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{t('profile.uploadDocument') || 'رفع مستند'}</span>
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

        {/* Documents List */}
        <div className="space-y-2">
          {docs.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              {t('profile.noDocuments') || 'لا توجد مستندات مرفوعة'}
            </p>
          ) : (
            docs.map((doc) => {
              const statusInfo = getStatusBadge(doc.verification_status);
              const StatusIcon = statusInfo.icon;
              return (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{doc.file_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.uploaded_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="text-red-600 hover:text-red-700 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          {t('profile.verificationNote') || 'يرجى رفع المستندات المطلوبة للتحقق من هويتك المهنية. ستتم مراجعة المستندات من قبل الإدارة.'}
        </p>
      </div>

      <DocumentSection
        type="license"
        title={t('profile.lawyerLicense') || 'رخصة مزاولة المهنة'}
        description={t('profile.licenseDesc') || 'رخصة مزاولة مهنة المحاماة الصادرة من نقابة المحامين'}
      />

      <DocumentSection
        type="certificate"
        title={t('profile.certificates') || 'الشهادات الأكاديمية'}
        description={t('profile.certificateDesc') || 'شهادة البكالوريوس في القانون أو الشهادات العليا'}
      />

      <DocumentSection
        type="id"
        title={t('profile.nationalId') || 'بطاقة الهوية الوطنية'}
        description={t('profile.idDesc') || 'بطاقة الهوية الوطنية سارية المفعول'}
      />
    </div>
  );
};

export default LicenseUploader;
