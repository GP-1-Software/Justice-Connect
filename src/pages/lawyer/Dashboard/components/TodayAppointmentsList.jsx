import React, { useEffect, useState } from 'react';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';

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
        // Use 'en-CA' to get YYYY-MM-DD in local time
        const today = new Date().toLocaleDateString('en-CA');
        console.log('Fetching appointments for:', today);

        // Fetch * to match Calendar.jsx schema which works
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('lawyer_id', lawyer.lawyer_id)
          .eq('appointment_date', today)
          .order('appointment_time', { ascending: true });

        if (error) throw error;
        if (mounted) setItems(data || []);
      } catch (e) {
        console.warn('TodayAppointmentsList query error:', e.message);
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
                <p className="font-semibold text-gray-900 dark:text-white">
                  {a.client_name || '—'}
                </p>
                <p className="text-sm text-gray-500">
                  {a.appointment_time ? a.appointment_time.substring(0, 5) : (a.starts_at ? new Date(a.starts_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—')} • {a.meeting_type === 'online' ? 'أونلاين' : 'شخصي'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TodayAppointmentsList;
