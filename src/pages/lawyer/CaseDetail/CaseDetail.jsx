import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLawyerAuth } from '../../../hooks/useLawyerAuth';
import { supabase } from '../../../supabaseClient';
import {
  ArrowLeft,
  Loader2,
  FileText,
  Clock,
  CalendarDays,
  MessageSquare,
  FolderOpen,
  CheckSquare,
  AlertCircle,
  Scale
} from 'lucide-react';
import CaseHeader from './components/CaseHeader';
import UpdateComposer from './components/UpdateComposer';
import Timeline from './components/Timeline';
import PrivateNotes from './components/PrivateNotes';
import EvidenceUploader from './components/EvidenceUploader';
import TaskManager from './components/TaskManager';
import MeetingManager from './components/MeetingManager';
import ClientInfo from './components/ClientInfo';
import CourtFilingTracker from './components/CourtFilingTracker';

const CaseDetail = () => {
  const { caseId } = useParams();
  const location = useLocation();
  const { lawyer } = useLawyerAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: FileText },
    { id: 'court', label: 'المحكمة', icon: Scale },
    { id: 'timeline', label: 'الجدول الزمني', icon: Clock },
    { id: 'meetings', label: 'الاجتماعات', icon: CalendarDays },
    { id: 'notes', label: 'الملاحظات', icon: MessageSquare },
    { id: 'files', label: 'الملفات', icon: FolderOpen },
    { id: 'tasks', label: 'المهام', icon: CheckSquare }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    navigate(`${location.pathname}#${tabId}`, { replace: true });
  };

  // Handle URL hash for deep linking
  useEffect(() => {
    if (location.hash && !loading) {
      const id = location.hash.replace('#', '');
      if (tabs.find(tab => tab.id === id)) {
        setActiveTab(id);
      }
    } else if (!location.hash && !loading) {
      setActiveTab('overview');
    }
  }, [location.hash, loading]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div id="overview">
            <ClientInfo caseData={caseData} lawyerId={lawyer?.lawyer_id} />
          </div>
        );
      case 'court':
        return (
          <div id="court" className="space-y-6">
            <CourtFilingTracker caseId={caseId} caseData={caseData} />
          </div>
        );
      case 'timeline':
        return (
          <div id="timeline" className="space-y-6">
            <UpdateComposer caseId={caseId} onUpdateAdded={handleUpdateAdded} />
            <Timeline updates={updates} caseData={caseData} onEventDeleted={handleEventDeleted} />
          </div>
        );
      case 'meetings':
        return (
          <div id="meetings" className="space-y-6">
            <MeetingManager
              caseId={caseId}
              caseData={caseData}
              onTimelineEventAdded={handleUpdateAdded}
            />
          </div>
        );
      case 'notes':
        return (
          <div id="notes" className="space-y-6">
            <PrivateNotes caseId={caseId} onTimelineEventAdded={handleUpdateAdded} />
          </div>
        );
      case 'files':
        return (
          <div id="files" className="space-y-6">
            <EvidenceUploader caseId={caseId} onTimelineEventAdded={handleUpdateAdded} />
          </div>
        );
      case 'tasks':
        return (
          <div id="tasks" className="space-y-6">
            <TaskManager caseId={caseId} onTimelineEventAdded={handleUpdateAdded} />
          </div>
        );
      default:
        return null;
    }
  };

  const loadCaseDetails = async () => {
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
        .order('created_at', { ascending: false });

      if (updatesError) console.warn('Updates load error:', updatesError.message);

      setCaseData(caseInfo);
      setUpdates(updatesData || []);
    } catch (error) {
      console.error('Case detail load error:', error.message);
      setCaseData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    loadCaseDetails();

    // Realtime subscriptions
    const updatesChannel = supabase
      .channel('timeline-events-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'timeline_events', filter: `case_id=eq.${caseId}` },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            // Only add if it's a valid event with required fields
            if (payload.new.event_id && payload.new.event_type) {
              setUpdates(prev => [payload.new, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setUpdates(prev => prev.map(u => u.event_id === payload.new.event_id ? payload.new : u));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setUpdates(prev => prev.filter(u => u.event_id !== payload.old.event_id));
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
    if (newUpdate && newUpdate.event_id) {
      setUpdates(prev => [newUpdate, ...prev]);
    } else {
      // If newUpdate is not valid, reload updates
      loadCaseDetails();
    }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">القضية غير موجودة</h2>
          <button
            onClick={() => navigate('/lawyer/cases')}
            className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-all transform hover:scale-105 font-medium"
          >
            العودة للقضايا
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 sm:py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/lawyer/cases')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition mb-4 sm:mb-6"
      >
        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="text-sm sm:text-base">العودة للقضايا</span>
      </button>

      {/* Case Header */}
      <div id="case-header" className="mb-5">
        <CaseHeader caseData={caseData} onCaseUpdated={handleCaseUpdated} />
      </div>

      {/* Navigation Tabs */}
      <div className="mb-5">
        {/* Mobile Tabs - Scrollable */}
        <div className="sm:hidden bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 text-white shadow-lg'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-2">
          <div className="flex gap-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabClick(id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 text-white shadow-lg transform scale-105'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {caseData.status === 'rejected' ? (
        /* Rejected Case - Read Only View */
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowLeft className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 rotate-45" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
              قضية مرفوضة
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              هذه القضية تم رفضها ولا يمكن تعديلها أو إضافة محتوى جديد.
            </p>
            {/* Timeline for rejected cases - read only */}
            <div className="mt-6 sm:mt-8">
              <Timeline updates={updates} caseData={caseData} onEventDeleted={null} />
            </div>
          </div>
        </div>
      ) : (
        <div>
          {renderTabContent()}
        </div>
      )}
      </div>
    </div>
  );
};

export default CaseDetail;
