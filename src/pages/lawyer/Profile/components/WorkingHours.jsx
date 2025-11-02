import React, { useEffect, useState } from 'react';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';
import { Clock, Save, Loader2 } from 'lucide-react';

const WorkingHours = () => {
  const { lawyer } = useLawyerAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState({
    sunday: { enabled: false, start: '09:00', end: '17:00' },
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: false, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '17:00' }
  });

  const daysOfWeek = [
    { key: 'sunday', label: 'الأحد' },
    { key: 'monday', label: 'الاثنين' },
    { key: 'tuesday', label: 'الثلاثاء' },
    { key: 'wednesday', label: 'الأربعاء' },
    { key: 'thursday', label: 'الخميس' },
    { key: 'friday', label: 'الجمعة' },
    { key: 'saturday', label: 'السبت' }
  ];

  useEffect(() => {
    let mounted = true;
    async function loadSchedule() {
      if (!lawyer) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lawyer_availability')
          .select('*')
          .eq('lawyer_id', lawyer.lawyer_id)
          .maybeSingle();

        if (error) throw error;
        
        if (data && data.schedule && mounted) {
          // Merge database schedule with default schedule to ensure all days exist
          setSchedule(prev => ({
            ...prev,
            ...data.schedule
          }));
        }
      } catch (error) {
        console.warn('Schedule load error:', error.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSchedule();
    return () => { mounted = false; };
  }, [lawyer]);

  const handleToggleDay = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled
      }
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!lawyer) return;
    setSaving(true);
    try {
      // Check if record exists
      const { data: existing, error: checkError } = await supabase
        .from('lawyer_availability')
        .select('lawyer_id')
        .eq('lawyer_id', lawyer.lawyer_id)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('lawyer_availability')
          .update({ schedule })
          .eq('lawyer_id', lawyer.lawyer_id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('lawyer_availability')
          .insert([{
            lawyer_id: lawyer.lawyer_id,
            schedule
          }]);
        if (error) throw error;
      }

      alert('تم حفظ ساعات العمل بنجاح');
    } catch (error) {
      console.error('Save schedule error:', error.message);
      alert('حدث خطأ أثناء حفظ ساعات العمل');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            حدد ساعات عملك الأسبوعية. سيتمكن العملاء من حجز المواعيد خلال هذه الأوقات فقط.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {daysOfWeek.map(({ key, label }) => (
          <div
            key={key}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Day Toggle */}
              <div className="flex items-center gap-3 md:w-40">
                <input
                  type="checkbox"
                  checked={schedule[key].enabled}
                  onChange={() => handleToggleDay(key)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className={`font-semibold ${
                  schedule[key].enabled 
                    ? 'text-gray-900 dark:text-white' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {label}
                </span>
              </div>

              {/* Time Inputs */}
              {schedule[key].enabled && (
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      من:
                    </label>
                    <input
                      type="time"
                      value={schedule[key].start}
                      onChange={(e) => handleTimeChange(key, 'start', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">
                      إلى:
                    </label>
                    <input
                      type="time"
                      value={schedule[key].end}
                      onChange={(e) => handleTimeChange(key, 'end', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {!schedule[key].enabled && (
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  يوم إجازة
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              حفظ ساعات العمل
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default WorkingHours;
