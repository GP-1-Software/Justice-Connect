import { supabase } from '../supabaseClient';

/**
 * Get all invoices with client, lawyer, case, and appointment details
 */
export const getAllInvoices = async () => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:users!invoices_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone,
          city,
          id_number
        ),
        lawyer:lawyers!invoices_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          specialization
        ),
        case:cases(
          case_id,
          title,
          case_number,
          case_type,
          status
        ),
        appointment:appointments(
          id,
          appointment_number,
          appointment_date,
          appointment_time,
          appointment_type
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

/**
 * Get all payments with invoice, client, and lawyer details
 */
export const getAllPayments = async () => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(
          invoice_id,
          invoice_number,
          total_amount,
          status,
          issue_date,
          due_date
        ),
        client:users!payments_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone,
          id_number
        ),
        lawyer:lawyers!payments_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

/**
 * Get financial statistics
 */
export const getFinancialStatistics = async () => {
  try {
    // Get invoice statistics
    const { count: totalInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    if (invoicesError) throw invoicesError;

    // Get invoice counts by status
    const invoiceStatuses = ['pending', 'paid', 'overdue', 'cancelled'];
    const invoiceStatusCounts = {};

    for (const status of invoiceStatuses) {
      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      if (error) throw error;
      invoiceStatusCounts[status] = count || 0;
    }

    // Get payment statistics
    const { count: totalPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });

    if (paymentsError) throw paymentsError;

    // Get payment counts by status
    const paymentStatuses = ['pending', 'completed', 'failed', 'refunded'];
    const paymentStatusCounts = {};

    for (const status of paymentStatuses) {
      const { count, error } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      if (error) throw error;
      paymentStatusCounts[status] = count || 0;
    }

    // Get total revenue (completed payments)
    const { data: revenueData, error: revenueError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed');

    if (revenueError) throw revenueError;

    const totalRevenue = revenueData?.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) || 0;

    // Get pending amount (pending invoices)
    const { data: pendingData, error: pendingError } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('status', 'pending');

    if (pendingError) throw pendingError;

    const pendingAmount = pendingData?.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0) || 0;

    // Get overdue amount
    const { data: overdueData, error: overdueError } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('status', 'overdue');

    if (overdueError) throw overdueError;

    const overdueAmount = overdueData?.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount || 0), 0) || 0;

    return {
      totalInvoices: totalInvoices || 0,
      invoiceStatusCounts,
      totalPayments: totalPayments || 0,
      paymentStatusCounts,
      totalRevenue,
      pendingAmount,
      overdueAmount
    };
  } catch (error) {
    console.error('Error fetching financial statistics:', error);
    throw error;
  }
};

/**
 * Get invoice by ID with full details
 */
export const getInvoiceById = async (invoiceId) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:users!invoices_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone,
          city,
          id_number
        ),
        lawyer:lawyers!invoices_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          city,
          specialization,
          license_number
        ),
        case:cases(
          case_id,
          title,
          case_number,
          case_type,
          status,
          description
        ),
        appointment:appointments(
          id,
          appointment_number,
          appointment_date,
          appointment_time,
          appointment_type,
          meeting_method,
          duration_minutes
        ),
        payments:payments(
          payment_id,
          amount,
          payment_method,
          transaction_id,
          status,
          payment_date,
          created_at
        )
      `)
      .eq('invoice_id', invoiceId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching invoice by ID:', error);
    throw error;
  }
};

/**
 * Get payment by ID with full details
 */
export const getPaymentById = async (paymentId) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(
          invoice_id,
          invoice_number,
          total_amount,
          subtotal,
          tax_amount,
          discount_amount,
          status,
          issue_date,
          due_date,
          notes,
          case:cases(
            case_id,
            title,
            case_number
          ),
          appointment:appointments(
            id,
            appointment_number,
            appointment_date
          )
        ),
        client:users!payments_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email,
          phone,
          city,
          id_number
        ),
        lawyer:lawyers!payments_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email,
          phone,
          city,
          specialization
        )
      `)
      .eq('payment_id', paymentId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching payment by ID:', error);
    throw error;
  }
};

/**
 * Update invoice status
 */
export const updateInvoiceStatus = async (invoiceId, newStatus) => {
  try {
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (newStatus === 'paid') {
      updateData.paid_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('invoice_id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (paymentId, newStatus) => {
  try {
    const updateData = {
      status: newStatus
    };

    if (newStatus === 'completed') {
      updateData.payment_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('payment_id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

/**
 * Get invoices by status
 */
export const getInvoicesByStatus = async (status) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:users!invoices_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email
        ),
        lawyer:lawyers!invoices_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching invoices by status:', error);
    throw error;
  }
};

/**
 * Get payments by status
 */
export const getPaymentsByStatus = async (status) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(
          invoice_id,
          invoice_number,
          total_amount
        ),
        client:users!payments_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email
        ),
        lawyer:lawyers!payments_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payments by status:', error);
    throw error;
  }
};

/**
 * Search invoices
 */
export const searchInvoices = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:users!invoices_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email
        ),
        lawyer:lawyers!invoices_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email
        )
      `)
      .or(`invoice_number.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching invoices:', error);
    throw error;
  }
};

/**
 * Get invoices by date range
 */
export const getInvoicesByDateRange = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:users!invoices_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email
        ),
        lawyer:lawyers!invoices_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email
        )
      `)
      .gte('issue_date', startDate)
      .lte('issue_date', endDate)
      .order('issue_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching invoices by date range:', error);
    throw error;
  }
};

/**
 * Get payments by date range
 */
export const getPaymentsByDateRange = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(
          invoice_id,
          invoice_number,
          total_amount
        ),
        client:users!payments_client_id_fkey(
          user_id,
          first_name,
          last_name,
          email
        ),
        lawyer:lawyers!payments_lawyer_id_fkey(
          lawyer_id,
          first_name,
          last_name,
          email
        )
      `)
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payments by date range:', error);
    throw error;
  }
};
