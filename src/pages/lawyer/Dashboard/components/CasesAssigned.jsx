import React, { useEffect, useState } from 'react';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const CasesAssigned = () => {
  const { t } = useTranslation();
  const { lawyer } = useLawyerAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!lawyer) return;
      setLoading(true);
      try {
        // Try direct column first
        let query = supabase
          .from('cases')
          .select('id, title, status, updated_at')
          .eq('assigned_lawyer_id', lawyer.lawyer_id)
          .order('updated_at', { ascending: false })
          .limit(5);
        let { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) {
          // Fallback: many-to-many via lawyer_cases
          const { data: joinData, error: joinError } = await supabase
            .from('lawyer_cases')
            .select('case_id, cases(id, title, status, updated_at)')
            .eq('lawyer_id', lawyer.lawyer_id)
            .order('cases(updated_at)', { ascending: false })
            .limit(5);
          if (joinError) throw joinError;
          data = (joinData || []).map(r => r.cases).filter(Boolean);
        }
        if (mounted) setItems(data || []);
      } catch (e) {
        console.warn('CasesAssigned query skipped or missing table:', e.message);
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
      <h3 className="font-bold text-gray-900 dark:text-white mb-3">{t('lawyer.cases')}</h3>
      {loading ? (
        <div className="text-gray-500">...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">لا توجد قضايا حالياً</div>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{c.title || '—'}</p>
                <p className="text-sm text-gray-500">{c.status || '—'}</p>
              </div>
              <Link to={`/lawyer/cases/${c.id}`} className="text-blue-600 hover:underline text-sm">عرض</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CasesAssigned;


