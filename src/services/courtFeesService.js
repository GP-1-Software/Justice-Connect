// Court Fees Service for Client
// خدمة رسوم المحكمة للعميل

import { supabase } from '../supabaseClient';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'https://justice-connect-mobile.onrender.com'}/api/court-clerk/public`;

/**
 * Get all court fees for a client
 */
export const getClientCourtFees = async (clientId) => {
    try {
        const response = await fetch(`${API_BASE}/fees/client/${clientId}`);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch fees');
        }
        
        return { data: result.data, error: null };
    } catch (error) {
        console.error('Error fetching client court fees:', error);
        return { data: null, error };
    }
};

/**
 * Get single fee details
 */
export const getCourtFeeDetails = async (feeId) => {
    try {
        const response = await fetch(`${API_BASE}/fees/${feeId}`);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch fee');
        }
        
        return { data: result.data, error: null };
    } catch (error) {
        console.error('Error fetching fee details:', error);
        return { data: null, error };
    }
};

/**
 * Submit payment for a court fee
 */
export const submitCourtFeePayment = async (feeId, paymentData) => {
    try {
        const response = await fetch(`${API_BASE}/fees/${feeId}/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to submit payment');
        }
        
        return { data: result, error: null };
    } catch (error) {
        console.error('Error submitting court fee payment:', error);
        return { data: null, error };
    }
};

/**
 * Upload payment receipt to Supabase storage
 */
export const uploadPaymentReceipt = async (file, feeId) => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `fee-receipt-${feeId}-${Date.now()}.${fileExt}`;
        const filePath = `fee-receipts/${fileName}`;

        const { data, error } = await supabase.storage
            .from('case-documents')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('case-documents')
            .getPublicUrl(filePath);

        return { 
            data: { 
                path: data.path, 
                url: urlData.publicUrl 
            }, 
            error: null 
        };
    } catch (error) {
        console.error('Error uploading receipt:', error);
        return { data: null, error };
    }
};

/**
 * Get fee statistics for client
 */
export const getClientFeeStats = async (clientId) => {
    try {
        const { data: fees } = await getClientCourtFees(clientId);
        
        if (!fees) return { data: null, error: new Error('Failed to fetch fees') };

        const stats = {
            total: fees.length,
            pending_payment: fees.filter(f => f.fee_status === 'issued').length,
            pending_confirmation: fees.filter(f => f.fee_status === 'paid').length,
            confirmed: fees.filter(f => f.fee_status === 'confirmed').length,
            total_pending_amount: fees
                .filter(f => f.fee_status === 'issued')
                .reduce((sum, f) => sum + parseFloat(f.total_amount || 0), 0),
            total_paid_amount: fees
                .filter(f => ['paid', 'confirmed'].includes(f.fee_status))
                .reduce((sum, f) => sum + parseFloat(f.total_amount || 0), 0)
        };

        return { data: stats, error: null };
    } catch (error) {
        console.error('Error calculating fee stats:', error);
        return { data: null, error };
    }
};

export default {
    getClientCourtFees,
    getCourtFeeDetails,
    submitCourtFeePayment,
    uploadPaymentReceipt,
    getClientFeeStats
};
