import { useState, useEffect, useCallback } from 'react';
import {
  createInvoice,
  updateInvoice,
  updateInvoiceItems,
  updateInvoiceWithItems,
  deleteInvoice,
  cancelInvoice,
  getLawyerInvoices,
  getClientInvoices,
  getInvoiceById,
  getLawyerInvoiceStats,
  getClientInvoiceStats,
  generateInvoiceNumber,
  subscribeLawyerInvoices,
  subscribeClientInvoices,
  subscribeToInvoice
} from '../services/invoiceService';

/**
 * Hook for managing invoices with real-time updates
 */
export const useInvoices = (userId, userType, filters = {}) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    // Don't fetch if userId is null/undefined
    if (!userId) {
      console.log('⚠️ No userId provided, skipping fetch');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching invoices:', { userId, userType, filters });
      
      const { data, error: fetchError } = userType === 'lawyer'
        ? await getLawyerInvoices(userId, filters)
        : await getClientInvoices(userId, filters);

      console.log('📊 Invoice fetch result:', { data, error: fetchError });

      if (fetchError) throw fetchError;
      setInvoices(data || []);
      
      console.log('✅ Invoices set:', data?.length || 0, 'invoices');
    } catch (err) {
      setError(err);
      console.error('❌ Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, userType, JSON.stringify(filters)]);

  // Subscribe to real-time updates
  useEffect(() => {
    fetchInvoices();

    const subscription = userType === 'lawyer'
      ? subscribeLawyerInvoices(userId, (payload) => {
          console.log('Invoice change detected:', payload);
          fetchInvoices(); // Refetch on any change
        })
      : subscribeClientInvoices(userId, (payload) => {
          console.log('Invoice change detected:', payload);
          fetchInvoices(); // Refetch on any change
        });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchInvoices, userId, userType]);

  return {
    invoices,
    loading,
    error,
    refetch: fetchInvoices
  };
};

/**
 * Hook for managing a single invoice with real-time updates
 */
export const useInvoice = (invoiceId) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch invoice
  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getInvoiceById(invoiceId);
      if (fetchError) throw fetchError;
      setInvoice(data);
    } catch (err) {
      setError(err);
      console.error('Error fetching invoice:', err);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!invoiceId) return;

    fetchInvoice();

    const subscription = subscribeToInvoice(invoiceId, (payload) => {
      console.log('Invoice updated:', payload);
      fetchInvoice();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchInvoice, invoiceId]);

  return {
    invoice,
    loading,
    error,
    refetch: fetchInvoice
  };
};

/**
 * Hook for invoice statistics with real-time updates
 */
export const useInvoiceStats = (userId, userType, period = 'month') => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = userType === 'lawyer'
        ? await getLawyerInvoiceStats(userId, period)
        : await getClientInvoiceStats(userId);

      if (fetchError) throw fetchError;
      setStats(data);
    } catch (err) {
      setError(err);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, userType, period]);

  // Subscribe to real-time updates
  useEffect(() => {
    fetchStats();

    const subscription = userType === 'lawyer'
      ? subscribeLawyerInvoices(userId, () => {
          fetchStats(); // Refetch stats on any invoice change
        })
      : subscribeClientInvoices(userId, () => {
          fetchStats();
        });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchStats, userId, userType]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

/**
 * Hook for invoice operations (create, update, delete)
 */
export const useInvoiceOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create invoice
  const create = async (invoiceData, items) => {
    setLoading(true);
    setError(null);

    try {
      // Generate invoice number
      const { data: invoiceNumber } = await generateInvoiceNumber();
      
      const { data, error: createError } = await createInvoice(
        { ...invoiceData, invoice_number: invoiceNumber },
        items
      );

      if (createError) throw createError;
      return { data, error: null };
    } catch (err) {
      setError(err);
      console.error('Error creating invoice:', err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Update invoice with items
  const update = async (invoiceId, invoiceData, items = null) => {
    setLoading(true);
    setError(null);

    try {
      if (items && items.length > 0) {
        // Use combined update function when items are provided
        const { data, error: updateError } = await updateInvoiceWithItems(invoiceId, invoiceData, items);
        if (updateError) throw updateError;
        return { data, error: null };
      } else {
        // Use simple update when no items
        const { data, error: updateError } = await updateInvoice(invoiceId, invoiceData);
        if (updateError) throw updateError;
        return { data, error: null };
      }
    } catch (err) {
      setError(err);
      console.error('Error updating invoice:', err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Cancel invoice
  const cancel = async (invoiceId, reason) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: cancelError } = await cancelInvoice(invoiceId, reason);
      if (cancelError) throw cancelError;
      return { data, error: null };
    } catch (err) {
      setError(err);
      console.error('Error cancelling invoice:', err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Delete invoice
  const remove = async (invoiceId) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await deleteInvoice(invoiceId);
      if (deleteError) throw deleteError;
      return { error: null };
    } catch (err) {
      setError(err);
      console.error('Error deleting invoice:', err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    create,
    update,
    cancel,
    remove,
    loading,
    error
  };
};
