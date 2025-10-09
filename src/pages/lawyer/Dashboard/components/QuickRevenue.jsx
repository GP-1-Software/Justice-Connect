import React, { useEffect, useState } from 'react';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';
import { useTranslation } from 'react-i18next';

const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d; };

const QuickRevenue = () => {
  const { t } = useTranslation();
  const { lawyer } = useLawyerAuth();
  const [week, setWeek] = useState(0);
  const [month, setMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!lawyer) return;
      setLoading(true);
      try {
        const weekFrom = daysAgo(7).toISOString();
        const monthFrom = daysAgo(30).toISOString();

        const q = (from) => supabase
          .from('payments')
          .select('amount', { count: 'exact' })
          .eq('lawyer_id', lawyer.lawyer_id)
          .gte('paid_at', from);

        const [wRes, mRes] = await Promise.all([q(weekFrom), q(monthFrom)]);
        const sum = (rows) => (rows || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
        if (mounted) {
          setWeek(sum(wRes.data));
          setMonth(sum(mRes.data));
        }
      } catch (e) {
        console.warn('QuickRevenue query skipped or missing table:', e.message);
        if (mounted) { setWeek(0); setMonth(0); }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [lawyer]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
      <h3 className="font-bold text-gray-900 dark:text-white mb-3">{t('lawyer.quickRevenue')}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
          <p className="text-sm text-gray-500">7 أيام</p>
          <p className="text-2xl font-extrabold text-green-600">{loading ? '...' : week.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
          <p className="text-sm text-gray-500">30 يوم</p>
          <p className="text-2xl font-extrabold text-blue-600">{loading ? '...' : month.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default QuickRevenue;


