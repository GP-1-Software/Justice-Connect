import { supabase } from '../supabaseClient';

/**
 * Invoice Service - Handles all invoice-related operations with Supabase
 */

// =====================================================
// Invoice CRUD Operations
// =====================================================

/**
 * Generate a new invoice number
 */
export const generateInvoiceNumber = async () => {
  try {
    const { data, error } = await supabase.rpc('generate_invoice_number');
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return { data: null, error };
  }
};

/**
 * Create a new invoice with items
 */
export const createInvoice = async (invoiceData, items) => {
  try {
    // Start a transaction by creating invoice first
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Add invoice_id to each item
    const itemsWithInvoiceId = items.map(item => ({
      ...item,
      invoice_id: invoice.invoice_id
    }));

    // Insert invoice items
    const { data: invoiceItems, error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsWithInvoiceId)
      .select();

    if (itemsError) throw itemsError;

    return {
      data: { ...invoice, items: invoiceItems },
      error: null
    };
  } catch (error) {
    console.error('Error creating invoice:', error);
    return { data: null, error };
  }
};

/**
 * Get all invoices for a lawyer
 */
export const getLawyerInvoices = async (lawyerId, filters = {}) => {
  try {
    console.log('🔍 getLawyerInvoices called with:', { lawyerId, filters });
    
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:users!invoices_client_id_fkey(user_id, first_name, last_name, email, phone),
        case:cases(case_id, title, case_number),
        appointment:appointments(id, appointment_number, appointment_date),
        items:invoice_items(*)
      `)
      .eq('lawyer_id', lawyerId)
      .order('created_at', { ascending: false });
      
    console.log('📝 Query built for lawyer_id:', lawyerId);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    if (filters.fromDate) {
      query = query.gte('issue_date', filters.fromDate);
    }
    if (filters.toDate) {
      query = query.lte('issue_date', filters.toDate);
    }

    const { data, error } = await query;

    console.log('📊 Raw query result:', { data, error, count: data?.length });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error fetching lawyer invoices:', error);
    return { data: null, error };
  }
};

/**
 * Get all invoices for a client
 */
export const getClientInvoices = async (clientId, filters = {}) => {
  try {
    console.log('🔍 getClientInvoices called with:', { clientId, filters });
    
    let query = supabase
      .from('invoices')
      .select(`
        *,
        lawyer:lawyers!invoices_lawyer_id_fkey(lawyer_id, first_name, last_name, email, phone, specialization),
        case:cases(case_id, title, case_number),
        appointment:appointments(id, appointment_number, appointment_date),
        items:invoice_items(*),
        payment:payments(payment_id, amount, payment_method, status, payment_date)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
      
    console.log('📝 Query built for client_id:', clientId);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.fromDate) {
      query = query.gte('issue_date', filters.fromDate);
    }
    if (filters.toDate) {
      query = query.lte('issue_date', filters.toDate);
    }

    const { data, error } = await query;

    console.log('📊 Raw client query result:', { data, error, count: data?.length });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error fetching client invoices:', error);
    return { data: null, error };
  }
};

/**
 * Get invoice by ID with all details
 */
export const getInvoiceById = async (invoiceId) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:users!invoices_client_id_fkey(user_id, first_name, last_name, email, phone, city),
        lawyer:lawyers!invoices_lawyer_id_fkey(lawyer_id, first_name, last_name, email, phone, specialization, license_number),
        case:cases(case_id, title, case_number),
        appointment:appointments(id, appointment_number, appointment_date),
        items:invoice_items(*),
        payments:payments(*)
      `)
      .eq('invoice_id', invoiceId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return { data: null, error };
  }
};

/**
 * Update invoice
 */
export const updateInvoice = async (invoiceId, updates) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('invoice_id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating invoice:', error);
    return { data: null, error };
  }
};

/**
 * Update invoice items
 */
export const updateInvoiceItems = async (invoiceId, items) => {
  try {
    // Delete existing items
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId);

    if (deleteError) throw deleteError;

    // Insert new items
    const itemsWithInvoiceId = items.map(item => ({
      ...item,
      invoice_id: invoiceId
    }));

    const { data, error } = await supabase
      .from('invoice_items')
      .insert(itemsWithInvoiceId)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating invoice items:', error);
    return { data: null, error };
  }
};

/**
 * Cancel invoice
 */
export const cancelInvoice = async (invoiceId, reason) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({ 
        status: 'cancelled',
        notes: reason 
      })
      .eq('invoice_id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    return { data: null, error };
  }
};

/**
 * Delete invoice
 */
export const deleteInvoice = async (invoiceId) => {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('invoice_id', invoiceId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return { error };
  }
};

// =====================================================
// Invoice Statistics
// =====================================================

/**
 * Get invoice statistics for lawyer
 */
export const getLawyerInvoiceStats = async (lawyerId, period = 'month') => {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('status, total_amount, created_at')
      .eq('lawyer_id', lawyerId);

    if (error) throw error;

    // Calculate statistics
    const now = new Date();
    const startOfPeriod = period === 'month' 
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), 0, 1);

    const periodInvoices = invoices.filter(inv => 
      new Date(inv.created_at) >= startOfPeriod
    );

    const stats = {
      total: invoices.length,
      pending: invoices.filter(inv => inv.status === 'pending').length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      overdue: invoices.filter(inv => inv.status === 'overdue').length,
      cancelled: invoices.filter(inv => inv.status === 'cancelled').length,
      totalAmount: invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
      paidAmount: invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
      pendingAmount: invoices
        .filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
      overdueAmount: invoices
        .filter(inv => inv.status === 'overdue')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
      periodTotal: periodInvoices.length,
      periodAmount: periodInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
      periodPaidAmount: periodInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0)
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    return { data: null, error };
  }
};

/**
 * Get invoice statistics for client
 */
export const getClientInvoiceStats = async (clientId) => {
  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('status, total_amount')
      .eq('client_id', clientId);

    if (error) throw error;

    const stats = {
      total: invoices.length,
      pending: invoices.filter(inv => inv.status === 'pending').length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      overdue: invoices.filter(inv => inv.status === 'overdue').length,
      totalAmount: invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
      paidAmount: invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
      pendingAmount: invoices
        .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0)
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching client invoice stats:', error);
    return { data: null, error };
  }
};

// =====================================================
// Real-time Subscriptions
// =====================================================

/**
 * Subscribe to invoice changes for a lawyer
 */
export const subscribeLawyerInvoices = (lawyerId, callback) => {
  const subscription = supabase
    .channel('lawyer-invoices')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'invoices',
        filter: `lawyer_id=eq.${lawyerId}`
      },
      callback
    )
    .subscribe();

  return subscription;
};

/**
 * Subscribe to invoice changes for a client
 */
export const subscribeClientInvoices = (clientId, callback) => {
  const subscription = supabase
    .channel('client-invoices')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'invoices',
        filter: `client_id=eq.${clientId}`
      },
      callback
    )
    .subscribe();

  return subscription;
};

/**
 * Subscribe to specific invoice changes
 */
export const subscribeToInvoice = (invoiceId, callback) => {
  const subscription = supabase
    .channel(`invoice-${invoiceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'invoices',
        filter: `invoice_id=eq.${invoiceId}`
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
 * Calculate invoice totals
 */
export const calculateInvoiceTotals = (items, taxPercentage = 0, discountAmount = 0) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0));
  }, 0);

  const taxAmount = (subtotal * parseFloat(taxPercentage || 0)) / 100;
  const totalAmount = subtotal + taxAmount - parseFloat(discountAmount || 0);

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2))
  };
};

/**
 * Check if invoice is overdue
 */
export const isInvoiceOverdue = (invoice) => {
  if (invoice.status !== 'pending') return false;
  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};

/**
 * Get invoice status color
 */
export const getInvoiceStatusColor = (status) => {
  const colors = {
    pending: 'yellow',
    paid: 'green',
    overdue: 'red',
    cancelled: 'gray'
  };
  return colors[status] || 'gray';
};

/**
 * Get invoice status label in Arabic
 */
export const getInvoiceStatusLabel = (status) => {
  const labels = {
    pending: 'معلق',
    paid: 'مدفوع',
    overdue: 'متأخر',
    cancelled: 'ملغي'
  };
  return labels[status] || status;
};

/**
 * Format currency with proper symbols
 */
export const formatCurrency = (amount, currency = 'ILS') => {
  const symbols = {
    'JOD': 'د.أ',
    'ILS': '₪'
  };
  
  const symbol = symbols[currency] || currency;
  const formattedAmount = parseFloat(amount).toFixed(2);
  
  // For RTL currencies (JOD, ILS), put symbol after amount
  if (currency === 'JOD' || currency === 'ILS') {
    return `${formattedAmount} ${symbol}`;
  }
  
  // For LTR currencies (USD), put symbol before amount
  return `${symbol}${formattedAmount}`;
};

/**
 * Update invoice with items (combined operation)
 */
export const updateInvoiceWithItems = async (invoiceId, invoiceData, items) => {
  try {
    console.log('🔄 Updating invoice with items:', { invoiceId, invoiceData, items });

    // Prepare invoice updates
    const invoiceUpdates = {
      invoice_number: invoiceData.invoice_number,
      issue_date: invoiceData.issue_date,
      due_date: invoiceData.due_date,
      notes: invoiceData.notes || invoiceData.description, // استخدام notes بدلاً من description
      discount_amount: parseFloat(invoiceData.discount_amount) || 0,
      tax_percentage: parseFloat(invoiceData.tax_percentage) || 0,
      total_amount: invoiceData.total_amount,
      updated_at: new Date().toISOString()
    };

    // Update invoice
    const { data: updatedInvoice, error: invoiceError } = await updateInvoice(invoiceId, invoiceUpdates);
    if (invoiceError) throw invoiceError;

    // Update items if provided
    if (items && items.length > 0) {
      const { data: updatedItems, error: itemsError } = await updateInvoiceItems(invoiceId, items);
      if (itemsError) throw itemsError;
      
      console.log('✅ Invoice items updated:', updatedItems);
    }

    console.log('✅ Invoice updated successfully:', updatedInvoice);
    return { data: updatedInvoice, error: null };
  } catch (error) {
    console.error('❌ Error updating invoice with items:', error);
    return { data: null, error };
  }
};

