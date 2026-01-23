import { supabase } from '../supabaseClient';

/**
 * Payment Service - Handles all payment-related operations
 */

// =====================================================
// Payment CRUD Operations
// =====================================================

/**
 * Create a new payment
 */
export const createPayment = async (paymentData) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating payment:', error);
    return { data: null, error };
  }
};

/**
 * Get payments for an invoice
 */
export const getInvoicePayments = async (invoiceId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching invoice payments:', error);
    return { data: null, error };
  }
};

/**
 * Get all payments for a lawyer
 */
export const getLawyerPayments = async (lawyerId, filters = {}) => {
  try {
    let query = supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(invoice_id, invoice_number, total_amount),
        client:users!payments_client_id_fkey(user_id, first_name, last_name, email)
      `)
      .eq('lawyer_id', lawyerId)
      .order('payment_date', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.fromDate) {
      query = query.gte('payment_date', filters.fromDate);
    }
    if (filters.toDate) {
      query = query.lte('payment_date', filters.toDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching lawyer payments:', error);
    return { data: null, error };
  }
};

/**
 * Get all payments for a client
 */
export const getClientPayments = async (clientId, filters = {}) => {
  try {
    let query = supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(invoice_id, invoice_number, total_amount),
        lawyer:lawyers!payments_lawyer_id_fkey(lawyer_id, first_name, last_name, email)
      `)
      .eq('client_id', clientId)
      .order('payment_date', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.fromDate) {
      query = query.gte('payment_date', filters.fromDate);
    }
    if (filters.toDate) {
      query = query.lte('payment_date', filters.toDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching client payments:', error);
    return { data: null, error };
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (paymentId, status, additionalData = {}) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update({ 
        status,
        ...additionalData
      })
      .eq('payment_id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating payment status:', error);
    return { data: null, error };
  }
};

/**
 * Process payment (simulate payment gateway)
 */
export const processPayment = async (invoiceId, paymentMethod, paymentDetails = {}) => {
  try {
    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    // Create payment record
    const paymentData = {
      invoice_id: invoiceId,
      client_id: invoice.client_id,
      lawyer_id: invoice.lawyer_id,
      amount: invoice.total_amount,
      currency: invoice.currency,
      payment_method: paymentMethod,
      transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      payment_gateway: paymentDetails.gateway || 'manual',
      status: 'completed', // In real app, this would be 'pending' until confirmed
      notes: paymentDetails.notes || null,
      payment_proof_url: paymentDetails.proofUrl || null
    };

    const { data: payment, error: paymentError } = await createPayment(paymentData);

    if (paymentError) throw paymentError;

    // Update invoice status to 'paid'
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('invoice_id', invoiceId);

    if (updateError) {
      console.error('Error updating invoice status:', updateError);
    }

    return { data: payment, error: null };
  } catch (error) {
    console.error('Error processing payment:', error);
    return { data: null, error };
  }
};

// =====================================================
// Payment Statistics
// =====================================================

/**
 * Get payment statistics for lawyer
 */
export const getLawyerPaymentStats = async (lawyerId, period = 'month') => {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('status, amount, payment_date')
      .eq('lawyer_id', lawyerId)
      .eq('status', 'completed');

    if (error) throw error;

    // Calculate statistics
    const now = new Date();
    const startOfPeriod = period === 'month' 
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), 0, 1);

    const periodPayments = payments.filter(payment => 
      new Date(payment.payment_date) >= startOfPeriod
    );

    const stats = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
      periodPayments: periodPayments.length,
      periodAmount: periodPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return { data: null, error };
  }
};

// =====================================================
// Real-time Subscriptions
// =====================================================

/**
 * Subscribe to payment changes for a lawyer
 */
export const subscribeLawyerPayments = (lawyerId, callback) => {
  const subscription = supabase
    .channel('lawyer-payments')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payments',
        filter: `lawyer_id=eq.${lawyerId}`
      },
      callback
    )
    .subscribe();

  return subscription;
};

/**
 * Subscribe to payment changes for a client
 */
export const subscribeClientPayments = (clientId, callback) => {
  const subscription = supabase
    .channel('client-payments')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payments',
        filter: `client_id=eq.${clientId}`
      },
      callback
    )
    .subscribe();

  return subscription;
};

// =====================================================
// Helper Functions
// =====================================================

/**
 * Get payment method label in Arabic
 */
export const getPaymentMethodLabel = (method) => {
  const labels = {
    card: 'بطاقة ائتمان',
    cash: 'نقداً',
    bank_transfer: 'تحويل بنكي',
    paypal: 'باي بال',
    cliq: 'كليك'
  };
  return labels[method] || method;
};

/**
 * Get payment status label in Arabic
 */
export const getPaymentStatusLabel = (status) => {
  const labels = {
    pending: 'قيد الانتظار',
    completed: 'مكتمل',
    failed: 'فشل',
    refunded: 'مسترد'
  };
  return labels[status] || status;
};

/**
 * Get payment status color
 */
export const getPaymentStatusColor = (status) => {
  const colors = {
    pending: 'yellow',
    completed: 'green',
    failed: 'red',
    refunded: 'gray'
  };
  return colors[status] || 'gray';
};
