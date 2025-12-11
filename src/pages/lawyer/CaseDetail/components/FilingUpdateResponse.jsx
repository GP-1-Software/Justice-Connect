import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Upload, 
    X, 
    FileText, 
    Send, 
    CheckCircle, 
    AlertCircle,
    Paperclip,
    Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../../supabaseClient';

/**
 * Filing Update Response - الرد على طلبات التعديل
 * Allows lawyer to respond to court clerk's update requests
 */
const FilingUpdateResponse = ({ filing, onUpdateSent }) => {
    const [responseText, setResponseText] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const fileInputRef = useRef(null);

    // Handle file selection
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        const validFiles = files.filter(file => {
            if (file.size > maxSize) {
                toast.error(`الملف ${file.name} أكبر من 10 ميجابايت`);
                return false;
            }
            return true;
        });

        setAttachments(prev => [...prev, ...validFiles]);
    };

    // Remove attachment
    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    // Upload files to Supabase Storage
    const uploadFiles = async () => {
        const uploadedFiles = [];
        
        for (const file of attachments) {
            // Use filing-attachments bucket with proper path
            const fileName = `lawyer-responses/${filing.filing_id}/${Date.now()}-${file.name}`;
            
            const { data, error } = await supabase.storage
                .from('case-documents')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Upload error:', error);
                // Try alternative bucket
                const { data: altData, error: altError } = await supabase.storage
                    .from('documents')
                    .upload(`public/${fileName}`, file, {
                        cacheControl: '3600',
                        upsert: false
                    });
                
                if (altError) {
                    console.error('Alt upload error:', altError);
                    continue;
                }
                
                const { data: altUrlData } = supabase.storage
                    .from('documents')
                    .getPublicUrl(`public/${fileName}`);
                    
                uploadedFiles.push({
                    file_name: file.name,
                    file_url: altUrlData.publicUrl,
                    file_type: file.type,
                    file_size: file.size,
                    attachment_type: 'update_response'
                });
                continue;
            }

            const { data: publicUrlData } = supabase.storage
                .from('case-documents')
                .getPublicUrl(fileName);

            uploadedFiles.push({
                file_name: file.name,
                file_url: publicUrlData.publicUrl,
                file_type: file.type,
                file_size: file.size,
                attachment_type: 'update_response'
            });
        }

        return uploadedFiles;
    };

    // Submit response
    const handleSubmit = async () => {
        if (!responseText.trim() && attachments.length === 0) {
            toast.error('يرجى إضافة رد أو مرفقات');
            return;
        }

        setLoading(true);

        try {
            // Upload attachments
            let uploadedAttachments = [];
            if (attachments.length > 0) {
                toast.loading('جاري رفع المرفقات...', { id: 'upload' });
                uploadedAttachments = await uploadFiles();
                toast.success('تم رفع المرفقات', { id: 'upload' });
            }

            // Get lawyer info
            const user = JSON.parse(localStorage.getItem('user'));

            // Insert attachments into filing_attachments
            if (uploadedAttachments.length > 0) {
                const attachmentRecords = uploadedAttachments.map(att => ({
                    filing_id: filing.filing_id,
                    file_name: att.file_name,
                    file_url: att.file_url,
                    file_type: att.file_type,
                    file_size: att.file_size,
                    attachment_type: 'update_response',
                    uploaded_by: user.lawyer_id || user.user_id,
                    uploaded_by_type: 'lawyer'
                }));

                const { error: attachError } = await supabase
                    .from('filing_attachments')
                    .insert(attachmentRecords);

                if (attachError) {
                    console.error('Attachment insert error:', attachError);
                    // Continue anyway - attachments are not critical
                }
            }

            // Store lawyer response in the filing itself
            console.log('Saving lawyer response:', responseText);
            const { data: updateData, error: updateError } = await supabase
                .from('court_clerk_filings')
                .update({
                    filing_status: 'under_review',
                    lawyer_response: responseText || null,
                    lawyer_response_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('filing_id', filing.filing_id)
                .select();

            if (updateError) {
                console.error('Update error:', updateError);
                throw updateError;
            }
            console.log('Update result:', updateData);

            // Add timeline event (with shorter event_type)
            if (filing.case_id) {
                const { error: timelineError } = await supabase.from('timeline_events').insert({
                    case_id: filing.case_id,
                    event_type: 'update',
                    author_id: user.lawyer_id || user.user_id,
                    author_type: 'lawyer',
                    title: 'تم إرسال التعديلات المطلوبة',
                    description: responseText || 'تم رفع المستندات المطلوبة',
                    visibility: 'all'
                });
                
                if (timelineError) console.error('Timeline error:', timelineError);
            }

            toast.success('تم إرسال الرد بنجاح');
            setResponseText('');
            setAttachments([]);
            setShowForm(false);

            if (onUpdateSent) onUpdateSent();

        } catch (error) {
            console.error('Error submitting response:', error);
            toast.error('حدث خطأ أثناء إرسال الرد');
        } finally {
            setLoading(false);
        }
    };

    // Don't show if filing is not in update_required status
    if (filing?.filing_status !== 'update_required') {
        return null;
    }

    return (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5">
            {/* Header with review notes */}
            <div className="flex items-start gap-3 mb-4">
                <div className="bg-orange-100 dark:bg-orange-800 p-2 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-orange-800 dark:text-orange-400">
                        مطلوب تعديلات على اللائحة
                    </h3>
                    {/* Display requested changes */}
                    {filing.requested_changes && (
                        <div className="mt-2 bg-orange-100 dark:bg-orange-900/40 p-3 rounded-lg">
                            <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-1">
                                التعديلات المطلوبة:
                            </p>
                            <p className="text-orange-700 dark:text-orange-200 whitespace-pre-wrap">
                                {filing.requested_changes}
                            </p>
                        </div>
                    )}
                    {/* Display review notes */}
                    {filing.review_notes && (
                        <div className="mt-2">
                            <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-1">
                                ملاحظات قلم المحكمة:
                            </p>
                            <p className="text-orange-700 dark:text-orange-300">
                                {filing.review_notes}
                            </p>
                        </div>
                    )}
                    {/* Display requested documents */}
                    {filing.requested_documents && (
                        <div className="mt-2">
                            <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-1">
                                المستندات المطلوبة:
                            </p>
                            <p className="text-orange-700 dark:text-orange-300">
                                {filing.requested_documents}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle form button */}
            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <Upload className="w-5 h-5" />
                    إرسال التعديلات المطلوبة
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                >
                    {/* Response text */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            ردك على الملاحظات
                        </label>
                        <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="اكتب ردك هنا أو أي توضيحات إضافية..."
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-orange-500 focus:ring-0 dark:bg-gray-800 dark:text-white resize-none"
                            rows={4}
                        />
                    </div>

                    {/* File upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            رفع المستندات المطلوبة
                        </label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-orange-500 transition-colors"
                        >
                            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600 dark:text-gray-400">
                                اضغط لرفع الملفات أو اسحبها هنا
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                PDF, Word, صور (حد أقصى 10 ميجابايت لكل ملف)
                            </p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            className="hidden"
                        />
                    </div>

                    {/* Attachments list */}
                    <AnimatePresence>
                        {attachments.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-2"
                            >
                                {attachments.map((file, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-blue-500" />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {(file.size / 1024 / 1024).toFixed(2)} ميجابايت
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeAttachment(index)}
                                            className="p-1 hover:bg-red-100 rounded-full text-red-500"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowForm(false)}
                            className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            disabled={loading}
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || (!responseText.trim() && attachments.length === 0)}
                            className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    جاري الإرسال...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    إرسال الرد
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default FilingUpdateResponse;
