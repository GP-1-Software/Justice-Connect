import React, { useEffect, useState } from 'react';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';

const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };

const TodayAppointmentsList = () => {
  const { lawyer } = useLawyerAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!lawyer) return;
      setLoading(true);
      try {
        const from = startOfDay(new Date()).toISOString();
        const to = endOfDay(new Date()).toISOString();
        const { data, error } = await supabase
          .from('appointments')
          .select('id, title, client_name, starts_at, mode')
          .eq('lawyer_id', lawyer.lawyer_id)
          .gte('starts_at', from)
          .lte('starts_at', to)
          .order('starts_at', { ascending: true });
        if (error) throw error;
        if (mounted) setItems(data || []);
      } catch (e) {
        console.warn('TodayAppointmentsList query skipped or missing table:', e.message);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [lawyer]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
      <h3 className="font-bold text-gray-900 dark:text-white mb-3">اليوم — المواعيد</h3>
      {loading ? (
        <div className="text-gray-500">...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">لا توجد مواعيد اليوم</div>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{a.title || a.client_name || '—'}</p>
                <p className="text-sm text-gray-500">{new Date(a.starts_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} • {a.mode || '—'}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TodayAppointmentsList;


