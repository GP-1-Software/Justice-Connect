import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { supabase } from '../supabaseClient';
import CaseReportPDF from '../components/client/case-details/CaseReportPDF';

export const useCaseReport = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  /**
   * جلب جميع بيانات القضية
   */
  const fetchCaseData = async (caseId) => {
    try {
      setProgress(10);

      // 1. جلب معلومات القضية مع العميل والمحامي
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select(`
          *,
          client:users!cases_client_id_fkey (
            user_id,
            first_name,
            last_name,
            email,
            phone,
            id_number,
            city
          ),
          lawyer:lawyers!cases_assigned_lawyer_id_fkey (
            lawyer_id,
            first_name,
            last_name,
            email,
            phone,
            specialization,
            license_number,
            profile_image_url
          )
        `)
        .eq('case_id', caseId)
        .single();

      if (caseError) throw caseError;
      setProgress(30);

      // 2. جلب الجدول الزمني
      const { data: timeline, error: timelineError } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (timelineError) throw timelineError;
      setProgress(50);

      // 3. جلب المهام
      const { data: tasks, error: tasksError } = await supabase
        .from('case_tasks')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setProgress(60);

      // 4. جلب الملاحظات المشتركة فقط
      const { data: notes, error: notesError } = await supabase
        .from('case_notes')
        .select(`
          *,
          lawyer:lawyers!case_notes_lawyer_id_fkey (
            lawyer_id,
            first_name,
            last_name
          )
        `)
        .eq('case_id', caseId)
        .eq('is_shared', true)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setProgress(70);

      // 5. جلب الملفات
      const { data: files, error: filesError } = await supabase
        .from('case_files')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (filesError) throw filesError;
      setProgress(80);

      // 6. جلب المواعيد (إذا موجودة)
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('case_id', caseId)
        .order('appointment_date', { ascending: false });

      setProgress(90);

      return {
        caseData,
        client: caseData.client,
        lawyer: caseData.lawyer,
        timeline: timeline || [],
        tasks: tasks || [],
        notes: notes || [],
        files: files || [],
        appointments: appointments || []
      };
    } catch (err) {
      console.error('Error fetching case data:', err);
      throw err;
    }
  };

  /**
   * توليد PDF
   */
  const generatePDF = async (reportData) => {
    try {
      setProgress(92);
      
      // إنشاء PDF Document
      const blob = await pdf(
        <CaseReportPDF {...reportData} />
      ).toBlob();

      setProgress(95);
      return blob;
    } catch (err) {
      console.error('Error generating PDF:', err);
      throw err;
    }
  };

  /**
   * رفع PDF إلى Supabase Storage
   */
  const uploadPDFToStorage = async (blob, caseId) => {
    try {
      const timestamp = new Date().getTime();
      const fileName = `report-${timestamp}.pdf`;
      const filePath = `case-reports/${caseId}/${fileName}`;

      // رفع الملف
      const { data, error: uploadError } = await supabase.storage
        .from('case-reports')
        .upload(filePath, blob, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // الحصول على رابط عام (أو خاص حسب إعدادات الـ bucket)
      const { data: urlData } = supabase.storage
        .from('case-reports')
        .getPublicUrl(filePath);

      return {
        filePath: data.path,
        fileUrl: urlData.publicUrl,
        fileName
      };
    } catch (err) {
      console.error('Error uploading PDF:', err);
      throw err;
    }
  };

  /**
   * حفظ سجل التقرير في قاعدة البيانات
   */
  const saveReportRecord = async (caseId, fileUrl, fileName, generatedBy, generatedByType, caseTitle) => {
    try {
      const { data, error } = await supabase
        .from('case_reports')
        .insert({
          case_id: caseId,
          generated_by: generatedBy,
          generated_by_type: generatedByType,
          report_title: `تقرير القضية: ${caseTitle}`,
          report_description: `تقرير شامل للقضية رقم ${caseId}`,
          report_type: 'full',
          file_url: fileUrl,
          file_size: null // يمكن إضافة حجم الملف لاحقاً
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error saving report record:', err);
      throw err;
    }
  };

  /**
   * الدالة الرئيسية لتوليد التقرير
   */
  const generateCaseReport = async (caseId, userProfile) => {
    try {
      setIsGenerating(true);
      setError(null);
      setProgress(0);

      // 1. جلب البيانات
      const reportData = await fetchCaseData(caseId);

      // 2. توليد PDF
      const pdfBlob = await generatePDF(reportData);

      // 3. رفع إلى Storage
      const { fileUrl, fileName } = await uploadPDFToStorage(pdfBlob, caseId);

      // 4. حفظ السجل في قاعدة البيانات
      await saveReportRecord(
        caseId,
        fileUrl,
        fileName,
        userProfile.user_id,
        'client',
        reportData.caseData.title
      );

      setProgress(100);

      // 5. تحميل الملف للمستخدم
      const link = document.createElement('a');
      link.href = URL.createObjectURL(pdfBlob);
      link.download = `تقرير-القضية-${caseId}-${new Date().getTime()}.pdf`;
      link.click();

      return {
        success: true,
        fileUrl,
        fileName
      };
    } catch (err) {
      console.error('Error generating case report:', err);
      setError(err.message || 'حدث خطأ أثناء توليد التقرير');
      return {
        success: false,
        error: err.message
      };
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  /**
   * جلب التقارير السابقة للقضية
   */
  const getPreviousReports = async (caseId) => {
    try {
      const { data, error } = await supabase
        .from('case_reports')
        .select('*')
        .eq('case_id', caseId)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching previous reports:', err);
      return [];
    }
  };

  return {
    generateCaseReport,
    getPreviousReports,
    isGenerating,
    progress,
    error
  };
};
