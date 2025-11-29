import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useClientAuth } from '../../hooks/useClientAuth';
import { useCaseReport } from '../../hooks/useCaseReport';
import { useCaseAccess } from '../../hooks/useCaseAccess';
import { Loader2, AlertCircle, FileText, Clock, CheckSquare, FolderOpen, MessageSquare, Download, Ban } from 'lucide-react';
import CaseDetailsHeader from '../../components/client/case-details/CaseDetailsHeader';
import CaseOverview from '../../components/client/case-details/CaseOverview';
import CaseTimeline from '../../components/client/case-details/CaseTimeline';
import CaseTasks from '../../components/client/case-details/CaseTasks';
import CaseFiles from '../../components/client/case-details/CaseFiles';
import CaseNotes from '../../components/client/case-details/CaseNotes';
import MeetingCard from '../../components/shared/MeetingCard';
import { getMeetingByCase } from '../../services/meetingApi';

const CaseDetails = () => {
  const { caseId } = useParams();
  const location = useLocation();
  const { userProfile } = useClientAuth();
  const { generateCaseReport, isGenerating, progress, error: reportError } = useCaseReport();
  const { isDisabled, disabledReason, canPerformAction } = useCaseAccess(caseId);
  const [caseData, setCaseData] = useState(null);
  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [meeting, setMeeting] = useState(null);

  // Handle URL hash for deep linking
  useEffect(() => {
    if (location.hash) {
      const tab = location.hash.replace('#', '');
      if (['overview', 'timeline', 'tasks', 'files', 'notes'].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, [location.hash]);

  useEffect(() => {
    if (caseId && userProfile) {
      fetchCaseDetails();
    }

    // Real-time subscription for meetings
    if (caseId) {
      const meetingsChannel = supabase
        .channel(`case-meetings-${caseId}`)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'meetings',
            filter: `related_case_id=eq.${caseId}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              // New meeting created
              setMeeting(payload.new);
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              // Meeting updated
              setMeeting(payload.new);
            } else if (payload.eventType === 'DELETE' && payload.old) {
              // Meeting deleted
              setMeeting(null);
            }
          }
        )
        .subscribe();

      return () => {
        meetingsChannel.unsubscribe();
      };
    }
  }, [caseId, userProfile]);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch case with lawyer info
      const { data: caseInfo, error: caseError } = await supabase
        .from('cases')
        .select(`
          *,
          lawyer:lawyers!cases_assigned_lawyer_id_fkey (
            lawyer_id,
            first_name,
            last_name,
            email,
            phone,
            city,
            specialization,
            years_of_experience,
            license_number,
            bio,
            profile_image_url
          )
        `)
        .eq('case_id', caseId)
        .eq('client_id', userProfile.user_id)
        .single();

      if (caseError) throw caseError;

      if (!caseInfo) {
        throw new Error('القضية غير موجودة أو ليس لديك صلاحية للوصول إليها');
      }

      setCaseData(caseInfo);
      setLawyer(caseInfo.lawyer);

      // Fetch meeting if case is active
      if (caseInfo.status === 'active' || caseInfo.status === 'in_progress') {
        try {
          const meetingData = await getMeetingByCase(caseId);
          if (meetingData) {
            setMeeting(meetingData);
          }
        } catch (meetingError) {
          console.error('Error fetching meeting:', meetingError);
        }
      }
    } catch (error) {
      console.error('Error fetching case details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // دالة توليد التقرير
  const handleGenerateReport = async () => {
    if (!userProfile) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    const result = await generateCaseReport(caseId, userProfile);

    if (result.success) {
      alert('✅ تم توليد التقرير بنجاح وحفظه في النظام!');
    } else {
      alert(`❌ حدث خطأ: ${result.error}`);
    }
  };

  const tabs = [
    {
      id: 'overview',
      label: 'نظرة عامة',
      icon: FileText
    },
    {
      id: 'timeline',
      label: 'الجدول الزمني',
      icon: Clock
    },
    {
      id: 'tasks',
      label: 'المهام',
      icon: CheckSquare
    },
    {
      id: 'files',
      label: 'الملفات',
      icon: FolderOpen
    },
    {
      id: 'notes',
      label: 'الملاحظات',
      icon: MessageSquare
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">جاري تحميل تفاصيل القضية...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">حدث خطأ</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-all transform hover:scale-105 font-medium"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 sm:py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <CaseDetailsHeader caseData={caseData} />

        {/* Disabled Case Warning Banner */}
        {isDisabled && (
          <div className="mt-4 bg-red-500 dark:bg-red-600 text-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <Ban className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2">⚠️ القضية معطلة مؤقتاً</h3>
                <p className="text-sm sm:text-base mb-3">
                  تم تعطيل هذه القضية من قبل إدارة المنصة. لا يمكنك إجراء أي تعديلات حتى يتم تفعيلها مرة أخرى.
                </p>
                {disabledReason && (
                  <div className="bg-white/20 rounded-lg p-3">
                    <p className="text-xs sm:text-sm font-semibold mb-1">السبب:</p>
                    <p className="text-sm sm:text-base">{disabledReason}</p>
                  </div>
                )}
                <p className="text-xs sm:text-sm mt-3 opacity-90">
                  💡 للاستفسار عن سبب التعطيل أو طلب التفعيل، يرجى التواصل مع الدعم الفني.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* زر توليد التقرير */}
        <div className="mt-5">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري التوليد... {progress}%</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>📄 توليد تقرير القضية</span>
              </>
            )}
          </button>
          {reportError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              ❌ {reportError}
            </p>
          )}
        </div>

        {/* Meeting Card for Cases */}
        {meeting && (caseData?.status === 'active' || caseData?.status === 'in_progress') && (
          <div className="mt-5">
            <MeetingCard
              meeting={meeting}
              caseData={caseData}
              userType="client"
              onJoinMeeting={(meeting) => window.open(meeting.meeting_link, '_blank')}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="mt-5">
          {/* Mobile Tabs - Scrollable */}
          <div className="sm:hidden bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-2 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                        ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-2">
            <div className="flex gap-2">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                  >
                    <TabIcon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-5">
          {activeTab === 'overview' && <CaseOverview caseData={caseData} lawyer={lawyer} />}
          {activeTab === 'timeline' && <CaseTimeline caseId={caseId} />}
          {activeTab === 'tasks' && <CaseTasks caseId={caseId} canPerformAction={canPerformAction} isDisabled={isDisabled} />}
          {activeTab === 'files' && <CaseFiles caseId={caseId} canPerformAction={canPerformAction} isDisabled={isDisabled} />}
          {activeTab === 'notes' && <CaseNotes caseId={caseId} caseStatus={caseData?.status} canPerformAction={canPerformAction} isDisabled={isDisabled} />}
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
