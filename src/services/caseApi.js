import { supabase } from '../supabaseClient';

/**
 * Create a new case
 * @param {Object} caseData - Case data
 * @returns {Promise<Object>} Created case
 */
export const createCase = async (caseData) => {
  try {
    // Generate case number
    const caseNumber = await generateCaseNumber();
    
    const { data, error } = await supabase
      .from('cases')
      .insert([{
        client_id: caseData.client_id,
        assigned_lawyer_id: caseData.assigned_lawyer_id,
        title: caseData.title,
        case_type: caseData.case_type,
        description: caseData.description,
        status: caseData.status || 'pending',
        priority: caseData.priority || 'normal',
        case_number: caseNumber,
        court_name: caseData.court_name || null,
        filing_date: caseData.filing_date || null,
        next_hearing_date: caseData.next_hearing_date || null
      }])
      .select()
      .single();

    if (error) throw error;

    // Create initial timeline event
    await createTimelineEvent({
      case_id: data.case_id,
      event_type: 'case_created',
      author_id: caseData.client_id,
      author_type: 'client',
      title: 'تم إنشاء القضية',
      description: `تم إنشاء القضية: ${caseData.title}`,
      visibility: 'all'
    });

    return data;
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
};

/**
 * Generate unique case number
 * @returns {Promise<string>} Case number
 */
const generateCaseNumber = async () => {
  const year = new Date().getFullYear();
  const { count, error } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;

  const caseNum = (count || 0) + 1;
  return `CASE-${year}-${String(caseNum).padStart(5, '0')}`;
};

/**
 * Upload case file
 * @param {Object} fileData - File data
 * @returns {Promise<Object>} Uploaded file record
 */
export const uploadCaseFile = async (fileData) => {
  try {
    const { file, case_id, uploaded_by, uploader_type, description } = fileData;

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `case-files/${case_id}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('case-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('case-documents')
      .getPublicUrl(filePath);

    // Save file record to database
    const { data, error } = await supabase
      .from('case_files')
      .insert([{
        case_id,
        uploaded_by,
        uploader_type,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        description: description || null
      }])
      .select()
      .single();

    if (error) throw error;

    // Create timeline event for file upload
    await createTimelineEvent({
      case_id,
      event_type: 'file_uploaded',
      author_id: uploaded_by,
      author_type: uploader_type,
      title: 'تم رفع ملف',
      description: `تم رفع الملف: ${file.name}`,
      visibility: 'all',
      files: [{ file_id: data.file_id, file_name: file.name }]
    });

    return data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Get case by ID
 * @param {number} caseId - Case ID
 * @returns {Promise<Object>} Case details
 */
export const getCaseById = async (caseId) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        client:client_id (
          user_id,
          first_name,
          last_name,
          email,
          phone,
          profile_image_url
        ),
        lawyer:assigned_lawyer_id (
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          specialization,
          profile_image_url
        ),
        case_files (
          file_id,
          file_name,
          file_url,
          file_type,
          file_size,
          description,
          created_at
        )
      `)
      .eq('case_id', caseId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching case:', error);
    throw error;
  }
};

/**
 * Get cases for a user (client or lawyer)
 * @param {number} userId - User ID
 * @param {string} userType - 'client' or 'lawyer'
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} List of cases
 */
export const getUserCases = async (userId, userType, filters = {}) => {
  try {
    let query = supabase
      .from('cases')
      .select(`
        *,
        client:client_id (
          user_id,
          first_name,
          last_name,
          profile_image_url
        ),
        lawyer:assigned_lawyer_id (
          lawyer_id,
          first_name,
          last_name,
          specialization,
          profile_image_url
        )
      `);

    // Filter by user type
    if (userType === 'client') {
      query = query.eq('client_id', userId);
    } else if (userType === 'lawyer') {
      query = query.eq('assigned_lawyer_id', userId);
    }

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.case_type) {
      query = query.eq('case_type', filters.case_type);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    // Sort by created_at descending
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user cases:', error);
    throw error;
  }
};

/**
 * Update case
 * @param {number} caseId - Case ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated case
 */
export const updateCase = async (caseId, updates) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('case_id', caseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating case:', error);
    throw error;
  }
};

/**
 * Create timeline event
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} Created event
 */
export const createTimelineEvent = async (eventData) => {
  try {
    const { data, error } = await supabase
      .from('timeline_events')
      .insert([{
        case_id: eventData.case_id,
        event_type: eventData.event_type,
        author_id: eventData.author_id,
        author_type: eventData.author_type,
        title: eventData.title,
        description: eventData.description,
        visibility: eventData.visibility || 'all',
        files: eventData.files || null
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating timeline event:', error);
    throw error;
  }
};

/**
 * Get timeline events for a case
 * @param {number} caseId - Case ID
 * @returns {Promise<Array>} Timeline events
 */
export const getCaseTimeline = async (caseId) => {
  try {
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching timeline:', error);
    throw error;
  }
};

/**
 * Get case types (predefined list)
 * @returns {Array} Case types
 */
export const getCaseTypes = () => {
  return [
    { value: 'criminal', label_ar: 'قانون جنائي', label_en: 'Criminal Law' },
    { value: 'civil', label_ar: 'قانون مدني', label_en: 'Civil Law' },
    { value: 'commercial', label_ar: 'قانون تجاري', label_en: 'Commercial Law' },
    { value: 'family', label_ar: 'قانون أسري', label_en: 'Family Law' },
    { value: 'labor', label_ar: 'قانون عمل', label_en: 'Labor Law' },
    { value: 'real_estate', label_ar: 'قضايا عقارية', label_en: 'Real Estate' },
    { value: 'administrative', label_ar: 'قانون إداري', label_en: 'Administrative Law' },
    { value: 'other', label_ar: 'أخرى', label_en: 'Other' }
  ];
};

/**
 * Get case priorities
 * @returns {Array} Priorities
 */
export const getCasePriorities = () => {
  return [
    { value: 'low', label_ar: 'عادي', label_en: 'Low' },
    { value: 'normal', label_ar: 'متوسط', label_en: 'Normal' },
    { value: 'high', label_ar: 'مهم', label_en: 'High' },
    { value: 'urgent', label_ar: 'عاجل جداً', label_en: 'Urgent' }
  ];
};

/**
 * Get case statuses
 * @returns {Array} Statuses
 */
export const getCaseStatuses = () => {
  return [
    { value: 'pending', label_ar: 'قيد الانتظار', label_en: 'Pending' },
    { value: 'active', label_ar: 'نشط', label_en: 'Active' },
    { value: 'in_progress', label_ar: 'قيد التنفيذ', label_en: 'In Progress' },
    { value: 'on_hold', label_ar: 'معلق', label_en: 'On Hold' },
    { value: 'completed', label_ar: 'مكتمل', label_en: 'Completed' },
    { value: 'closed', label_ar: 'مغلق', label_en: 'Closed' },
    { value: 'cancelled', label_ar: 'ملغي', label_en: 'Cancelled' }
  ];
};

/**
 * Delete case file
 * @param {number} fileId - File ID
 * @returns {Promise<void>}
 */
export const deleteCaseFile = async (fileId) => {
  try {
    // Get file info first
    const { data: fileData, error: fetchError } = await supabase
      .from('case_files')
      .select('file_url')
      .eq('file_id', fileId)
      .single();

    if (fetchError) throw fetchError;

    // Extract file path from URL
    const urlParts = fileData.file_url.split('/case-documents/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('case-documents')
        .remove([filePath]);

      if (storageError) console.error('Storage deletion error:', storageError);
    }

    // Delete from database
    const { error } = await supabase
      .from('case_files')
      .delete()
      .eq('file_id', fileId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
