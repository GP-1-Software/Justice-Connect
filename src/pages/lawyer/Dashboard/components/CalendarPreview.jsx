import React, { useEffect, useState } from 'react';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';
import { useTranslation } from 'react-i18next';

const startOfWeek = (d) => {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday start
  date.setDate(date.getDate() - day);
  date.setHours(0,0,0,0);
  return date;
};
const endOfWeek = (d) => {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 7);
  e.setMilliseconds(-1);
  return e;
};

const CalendarPreview = () => {
  const { t } = useTranslation();
  const { lawyer } = useLawyerAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!lawyer) return;
      setLoading(true);
      try {
        const from = startOfWeek(new Date()).toISOString();
        const to = endOfWeek(new Date()).toISOString();

        const { count: c, error } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('lawyer_id', lawyer.lawyer_id)
          .gte('starts_at', from)
          .lte('starts_at', to);
        if (error) throw error;
        if (mounted) setCount(c || 0);
      } catch (e) {
        console.warn('CalendarPreview query skipped or missing table:', e.message);
        if (mounted) setCount(0);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [lawyer]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-900 dark:text-white">{t('lawyer.calendar')}</h3>
        <span className="text-sm text-gray-500">{t('lawyer.thisWeek')}</span>
      </div>
      <div className="text-3xl font-extrabold text-blue-600">{loading ? '...' : count}</div>
      <p className="text-sm text-gray-500 mt-1">{t('lawyer.appointments')}</p>
    </div>
  );
};

export default CalendarPreview;


