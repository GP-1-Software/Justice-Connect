import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLawyerAuth } from '../../../hooks/useLawyerAuth';
import { supabase } from '../../../supabaseClient';
import { ArrowLeft, Loader2 } from 'lucide-react';
import CaseHeader from './components/CaseHeader';
import UpdateComposer from './components/UpdateComposer';
import Timeline from './components/Timeline';
import PrivateNotes from './components/PrivateNotes';
import EvidenceUploader from './components/EvidenceUploader';
import TaskManager from './components/TaskManager';

const CaseDetail = () => {
  const { caseId } = useParams();
  const { lawyer } = useLawyerAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadCaseDetails() {
      if (!lawyer || !caseId) return;
      setLoading(true);
      try {
        // Load case data
        const { data: caseInfo, error: caseError } = await supabase
          .from('cases')
          .select('*')
          .eq('case_id', caseId)
          .single();

        if (caseError) throw caseError;

        // Load case timeline events
        const { data: updatesData, error: updatesError } = await supabase
          .from('timeline_events')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: false});

        if (updatesError) console.warn('Updates load error:', updatesError.message);

        if (mounted) {
          setCaseData(caseInfo);
          setUpdates(updatesData || []);
        }
      } catch (error) {
        console.error('Case detail load error:', error.message);
        if (mounted) {
          setCaseData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadCaseDetails();

    // Realtime subscriptions
    const updatesChannel = supabase
      .channel('timeline-events-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'timeline_events', filter: `case_id=eq.${caseId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setUpdates(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setUpdates(prev => prev.map(u => u.event_id === payload.new.event_id ? payload.new : u));
          }
        }
      )
      .subscribe();

    // Realtime subscription for case updates
    const casesChannel = supabase
      .channel('case-changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cases', filter: `case_id=eq.${caseId}` },
        (payload) => {
          if (mounted) {
            setCaseData(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      updatesChannel.unsubscribe();
      casesChannel.unsubscribe();
    };
  }, [lawyer, caseId]);

  const handleUpdateAdded = (newUpdate) => {
    setUpdates(prev => [newUpdate, ...prev]);
  };

  const handleCaseUpdated = (updatedCase, newTimelineEvent) => {
    setCaseData(updatedCase);
    if (newTimelineEvent) {
      setUpdates(prev => [newTimelineEvent, ...prev]);
    }
  };

  const handleEventDeleted = (eventId) => {
    setUpdates(prev => prev.filter(u => u.event_id !== eventId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="mr-3 text-gray-600 dark:text-gray-300">جاري التحميل...</span>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400 mb-4">القضية غير موجودة</p>
        <button
          onClick={() => navigate('/lawyer/cases')}
          className="text-blue-600 hover:underline"
        >
          العودة للقضايا
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/lawyer/cases')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition"
      >
        <ArrowLeft className="h-5 w-5" />
        العودة للقضايا
      </button>

      {/* Case Header */}
      <CaseHeader caseData={caseData} onCaseUpdated={handleCaseUpdated} />

      {caseData.status === 'rejected' ? (
        /* Rejected Case - Read Only View */
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowLeft className="h-8 w-8 text-red-600 rotate-45" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              قضية مرفوضة
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              هذه القضية تم رفضها ولا يمكن تعديلها أو إضافة محتوى جديد.
            </p>
            {/* Timeline for rejected cases - read only */}
            <div className="mt-8">
              <Timeline updates={updates} caseData={caseData} onEventDeleted={null} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Update Composer */}
            <UpdateComposer caseId={caseId} onUpdateAdded={handleUpdateAdded} />

            {/* Timeline */}
            <Timeline updates={updates} caseData={caseData} onEventDeleted={handleEventDeleted} />
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Private Notes */}
            <PrivateNotes caseId={caseId} onTimelineEventAdded={handleUpdateAdded} />

            {/* Evidence Uploader */}
            <EvidenceUploader caseId={caseId} />

            {/* Task Manager */}
            <TaskManager caseId={caseId} onTimelineEventAdded={handleUpdateAdded} />
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetail;
