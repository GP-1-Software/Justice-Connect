// ============================================
// Court Clerk API Service
// Extended with Lawyer Filing Submission
// ============================================

import { supabase } from '../supabaseClient';
import { getAuthHeaders } from '../utils/authHelpers';

const API_BASE_URL = 'https://justice-connect-mobile.onrender.com/api/court-clerk';

// ============================================
// COURTS API - المحاكم
// ============================================

/**
 * Get all active courts
 */
export const getCourts = async () => {
    const response = await fetch(`${API_BASE_URL}/courts`);
    if (!response.ok) throw new Error('Failed to fetch courts');
    return response.json();
};

/**
 * Get court by city and court_type
 */
export const getCourtByLocation = async (city, courtType) => {
    const params = new URLSearchParams({ city, court_type: courtType });
    const response = await fetch(`${API_BASE_URL}/courts/by-location?${params}`);
    if (!response.ok) throw new Error('Failed to fetch court');
    return response.json();
};

// ============================================
// LAWYER FILING SUBMISSIONS
// ============================================

/**
 * Submit a new court filing
 */
export const submitFiling = async (filingData) => {
    const response = await fetch(`${API_BASE_URL}/filings/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(filingData)
    });
    if (!response.ok) throw new Error('Failed to submit filing');
    return response.json();
};

/**
 * Save filing as draft
 */
export const saveDraft = async (draftData) => {
    const response = await fetch(`${API_BASE_URL}/filings/draft`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(draftData)
    });
    if (!response.ok) throw new Error('Failed to save draft');
    return response.json();
};

/**
 * Get lawyer's filings
 */
export const getLawyerFilings = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await fetch(`${API_BASE_URL}/filings/lawyer?${params}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch lawyer filings');
    return response.json();
};

/**
 * Upload filing attachments to Supabase Storage
 */
export const uploadFilingAttachments = async (files, filingId) => {
    const uploadedFiles = [];

    try {
        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${filingId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `filings/${fileName}`;

            // Try to upload to storage
            const { data, error } = await supabase.storage
                .from('case-documents')
                .upload(filePath, file);

            if (error) {
                console.warn('Storage upload failed, skipping file:', file.name, error);
                // Still add file info without URL
                uploadedFiles.push({
                    originalName: file.name,
                    storagePath: null,
                    publicUrl: null,
                    fileType: file.type,
                    fileSize: file.size
                });
                continue;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('case-documents')
                .getPublicUrl(filePath);

            uploadedFiles.push({
                originalName: file.name,
                storagePath: filePath,
                publicUrl: urlData?.publicUrl || null,
                fileType: file.type,
                fileSize: file.size
            });
        }
    } catch (error) {
        console.error('File upload error:', error);
        // Return empty array if all uploads fail
    }

    return uploadedFiles;
};

// ============================================
// COURT CLERK OPERATIONS
// ============================================

// Dashboard
export const getDashboardStats = async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
};

// Filings
export const getFilings = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`${API_BASE_URL}/filings?${params}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch filings');
    return response.json();
};

export const getFilingDetails = async (filingId) => {
    const response = await fetch(`${API_BASE_URL}/filings/${filingId}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch filing details');
    return response.json();
};

export const reviewFiling = async (filingId, reviewData) => {
    const response = await fetch(`${API_BASE_URL}/filings/${filingId}/review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(reviewData)
    });
    if (!response.ok) throw new Error('Failed to review filing');
    return response.json();
};

// Case Registration
export const registerCase = async (filingId, registrationData) => {
    const response = await fetch(`${API_BASE_URL}/filings/${filingId}/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(registrationData)
    });
    if (!response.ok) throw new Error('Failed to register case');
    return response.json();
};

// Services (Service of Process)
export const getCaseServices = async (caseId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/services`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch services');
    return response.json();
};

export const addServiceRecord = async (caseId, serviceData) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/services`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(serviceData)
    });
    if (!response.ok) throw new Error('Failed to add service record');
    return response.json();
};

// Hearings
export const getCaseHearings = async (caseId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/hearings`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch hearings');
    return response.json();
};

export const scheduleHearing = async (caseId, hearingData) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/hearings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(hearingData)
    });
    if (!response.ok) throw new Error('Failed to schedule hearing');
    return response.json();
};

export const updateHearing = async (hearingId, updateData) => {
    const response = await fetch(`${API_BASE_URL}/hearings/${hearingId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Failed to update hearing');
    return response.json();
};

// Decisions
export const getCaseDecisions = async (caseId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/decisions`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch decisions');
    return response.json();
};

export const issueDecision = async (caseId, decisionData) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}/decisions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(decisionData)
    });
    if (!response.ok) throw new Error('Failed to issue decision');
    return response.json();
};

// Cases
export const getCases = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.stage) params.append('stage', filters.stage);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`${API_BASE_URL}/cases?${params}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch cases');
    return response.json();
};

export const getCaseDetails = async (caseId) => {
    const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch case details');
    return response.json();
};

// Actions Log
export const getClerkActions = async (page = 1, limit = 50) => {
    const response = await fetch(`${API_BASE_URL}/actions?page=${page}&limit=${limit}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch actions');
    return response.json();
};

export default {
    getDashboardStats,
    getFilings,
    getFilingDetails,
    reviewFiling,
    registerCase,
    getCaseServices,
    addServiceRecord,
    getCaseHearings,
    scheduleHearing,
    updateHearing,
    getCaseDecisions,
    issueDecision,
    getCases,
    getCaseDetails,
    getClerkActions
};
