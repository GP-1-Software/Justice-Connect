import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

/**
 * Hook للتحقق من إمكانية الوصول والتعديل على القضية
 * يمنع أي عمليات على القضايا المعطلة من قبل الأدمن
 */
export const useCaseAccess = (caseId) => {
  const [isDisabled, setIsDisabled] = useState(false);
  const [disabledReason, setDisabledReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (caseId) {
      checkCaseStatus();
      
      // Real-time subscription للتحقق من التحديثات
      const channel = supabase
        .channel(`case-status-${caseId}`)
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'cases',
            filter: `case_id=eq.${caseId}`
          },
          (payload) => {
            if (payload.new) {
              setIsDisabled(payload.new.is_disabled || false);
              setDisabledReason(payload.new.disabled_reason || '');
              
              // إشعار المستخدم إذا تم التعطيل
              if (payload.new.is_disabled && !payload.old.is_disabled) {
                toast.error(`تم تعطيل هذه القضية من قبل الإدارة\nالسبب: ${payload.new.disabled_reason}`, {
                  duration: 6000,
                  style: {
                    background: '#EF4444',
                    color: '#FFFFFF',
                  }
                });
              }
              // إشعار المستخدم إذا تم التفعيل
              else if (!payload.new.is_disabled && payload.old.is_disabled) {
                toast.success('تم تفعيل القضية من قبل الإدارة', {
                  duration: 4000,
                  style: {
                    background: '#10B981',
                    color: '#FFFFFF',
                  }
                });
              }
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [caseId]);

  const checkCaseStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cases')
        .select('is_disabled, disabled_reason')
        .eq('case_id', caseId)
        .single();

      if (error) throw error;

      setIsDisabled(data?.is_disabled || false);
      setDisabledReason(data?.disabled_reason || '');
    } catch (error) {
      console.error('Error checking case status:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * التحقق من إمكانية تنفيذ عملية على القضية
   * @param {string} actionName - اسم العملية (للرسالة)
   * @returns {boolean} - true إذا كانت العملية مسموحة
   */
  const canPerformAction = (actionName = 'هذه العملية') => {
    if (isDisabled) {
      toast.error(
        `لا يمكن ${actionName} - القضية معطلة من قبل الإدارة\nالسبب: ${disabledReason}`,
        {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: '#FFFFFF',
          }
        }
      );
      return false;
    }
    return true;
  };

  return {
    isDisabled,
    disabledReason,
    loading,
    canPerformAction,
    checkCaseStatus
  };
};
