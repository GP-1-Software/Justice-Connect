import { useState, useEffect, useCallback } from 'react';
import {
  getLawyerPayments,
  getClientPayments,
  getInvoicePayments,
  createPayment,
  processPayment,
  updatePaymentStatus,
  getLawyerPaymentStats,
  subscribeLawyerPayments,
  subscribeClientPayments
} from '../services/paymentService';

/**
 * Hook for managing payments with real-time updates
 */
export const usePayments = (userId, userType, filters = {}) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = userType === 'lawyer'
        ? await getLawyerPayments(userId, filters)
        : await getClientPayments(userId, filters);

      if (fetchError) throw fetchError;
      setPayments(data || []);
    } catch (err) {
      setError(err);
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, userType, JSON.stringify(filters)]);

  // Subscribe to real-time updates
  useEffect(() => {
    fetchPayments();

    const subscription = userType === 'lawyer'
      ? subscribeLawyerPayments(userId, (payload) => {
          console.log('Payment change detected:', payload);
          fetchPayments();
        })
      : subscribeClientPayments(userId, (payload) => {
          console.log('Payment change detected:', payload);
          fetchPayments();
        });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchPayments, userId, userType]);

  return {
    payments,
    loading,
    error,
    refetch: fetchPayments
  };
};

/**
 * Hook for invoice payments
 */
export const useInvoicePayments = (invoiceId) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!invoiceId) return;

    const fetchPayments = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await getInvoicePayments(invoiceId);
        if (fetchError) throw fetchError;
        setPayments(data || []);
      } catch (err) {
        setError(err);
        console.error('Error fetching invoice payments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [invoiceId]);

  return {
    payments,
    loading,
    error
  };
};

/**
 * Hook for payment statistics
 */
export const usePaymentStats = (lawyerId, period = 'month') => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getLawyerPaymentStats(lawyerId, period);
      if (fetchError) throw fetchError;
      setStats(data);
    } catch (err) {
      setError(err);
      console.error('Error fetching payment stats:', err);
    } finally {
      setLoading(false);
    }
  }, [lawyerId, period]);

  useEffect(() => {
    fetchStats();

    const subscription = subscribeLawyerPayments(lawyerId, () => {
      fetchStats();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchStats, lawyerId]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

/**
 * Hook for payment operations
 */
export const usePaymentOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Process payment
  const process = async (invoiceId, paymentMethod, paymentDetails = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: processError } = await processPayment(
        invoiceId,
        paymentMethod,
        paymentDetails
      );

      if (processError) throw processError;
      return { data, error: null };
    } catch (err) {
      setError(err);
      console.error('Error processing payment:', err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Create payment manually
  const create = async (paymentData) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: createError } = await createPayment(paymentData);
      if (createError) throw createError;
      return { data, error: null };
    } catch (err) {
      setError(err);
      console.error('Error creating payment:', err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Update payment status
  const updateStatus = async (paymentId, status, additionalData = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await updatePaymentStatus(
        paymentId,
        status,
        additionalData
      );

      if (updateError) throw updateError;
      return { data, error: null };
    } catch (err) {
      setError(err);
      console.error('Error updating payment status:', err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    process,
    create,
    updateStatus,
    loading,
    error
  };
};
