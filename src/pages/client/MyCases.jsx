import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useClientAuth } from '../../hooks/useClientAuth';
import CaseStats from '../../components/client/cases/CaseStats';
import CaseFilters from '../../components/client/cases/CaseFilters';
import CaseCard from '../../components/client/cases/CaseCard';
import CaseQuickActions from '../../components/client/cases/CaseQuickActions';
import { Loader2, AlertCircle, FolderOpen, AlertTriangle, Scale, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MyCases = () => {
  const { userProfile } = useClientAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [casesAgainstMe, setCasesAgainstMe] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('my-cases'); // 'my-cases' or 'against-me'
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    completed: 0,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    caseType: 'all',
    priority: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch cases with lawyer info
  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is logged in
      if (!userProfile || !userProfile.user_id) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // Fetch MY cases (as plaintiff/client)
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select(`
          *,
          lawyer:lawyers!cases_assigned_lawyer_id_fkey (
            lawyer_id,
            first_name,
            last_name,
            profile_image_url,
            specialization
          )
        `)
        .or(`client_id.eq.${userProfile.user_id},client_id_number.eq.${userProfile.id_number}`)
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;

      // Fetch cases AGAINST ME (as defendant)
      const { data: casesAgainstData, error: casesAgainstError } = await supabase
        .from('court_clerk_filings')
        .select(`
          filing_id,
          case_id,
          filing_number,
          court_name,
          case_type,
          plaintiff_name,
          defendant_name,
          filing_summary,
          filing_status,
          submitted_at,
          created_at,
          cases:case_id (
            case_id,
            title,
            status,
            case_stage,
            court_name,
            case_number,
            created_at
          )
        `)
        .eq('defendant_id_number', userProfile.id_number)
        .order('created_at', { ascending: false });

      if (casesAgainstError) {
        console.error('Error fetching cases against me:', casesAgainstError);
      } else {
        setCasesAgainstMe(casesAgainstData || []);
      }

      // Fetch tasks count for each case
      const casesWithTasks = await Promise.all(
        (casesData || []).map(async (caseItem) => {
          const { data: tasks } = await supabase
            .from('case_tasks')
            .select('task_id, is_completed')
            .eq('case_id', caseItem.case_id);

          return {
            ...caseItem,
            tasks_count: tasks?.length || 0,
            completed_tasks: tasks?.filter(t => t.is_completed).length || 0
          };
        })
      );

      setCases(casesWithTasks);
      setFilteredCases(casesWithTasks);
      calculateStats(casesWithTasks);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (casesData) => {
    const stats = {
      active: casesData.filter(c => c.status === 'active' || c.status === 'in_progress').length,
      pending: casesData.filter(c => c.status === 'pending').length,
      completed: casesData.filter(c =>
        c.status === 'closed' ||
        c.status === 'completed' ||
        c.case_stage === 'fully_executed' ||
        c.case_stage === 'judgment_final'
      ).length,
      total: casesData.length
    };
    setStats(stats);
  };

  // Apply filters and search
  const applyFiltersAndSearch = () => {
    let filtered = [...cases];

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    // Apply case type filter
    if (filters.caseType !== 'all') {
      filtered = filtered.filter(c => c.case_type === filters.caseType);
    }

    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(c => c.priority === filters.priority);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.title?.toLowerCase().includes(query) ||
        c.case_number?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    }

    setFilteredCases(filtered);
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle search change
  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  // Get status badge for cases against me
  const getStatusBadge = (filing) => {
    const statusConfig = {
      'submitted': { label: 'مقدمة', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      'under_review': { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'registered': { label: 'مسجلة', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      'rejected': { label: 'مرفوضة', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    };
    const config = statusConfig[filing.filing_status] || statusConfig['submitted'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Load cases when userProfile is available
  useEffect(() => {
    if (userProfile && userProfile.user_id) {
      fetchCases();
    }
  }, [userProfile]);

  // Apply filters when they change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [filters, searchQuery, cases]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل القضايا...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-red-200 dark:border-red-800 p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">حدث خطأ</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchCases}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-all transform hover:scale-105"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-3 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">قضاياي</h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">إدارة ومتابعة جميع قضاياك القانونية</p>
        </div>

        {/* Quick Actions */}
        <CaseQuickActions />

        {/* Tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('my-cases')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'my-cases'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <Scale className="w-4 h-4" />
              قضاياي
              {cases.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'my-cases' ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}>
                  {cases.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('against-me')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'against-me'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <AlertTriangle className="w-4 h-4" />
              قضايا ضدي
              {casesAgainstMe.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'against-me' ? 'bg-white/20' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                  }`}>
                  {casesAgainstMe.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'my-cases' ? (
          <>
            {/* Statistics */}
            <CaseStats stats={stats} />

            {/* Filters */}
            <CaseFilters
              onFilterChange={handleFilterChange}
              onSearchChange={handleSearchChange}
            />

            {/* Cases Grid */}
            {filteredCases.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
                <FolderOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchQuery || filters.status !== 'all' || filters.caseType !== 'all' || filters.priority !== 'all'
                    ? 'لا توجد قضايا مطابقة للبحث'
                    : 'لا توجد قضايا حتى الآن'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery || filters.status !== 'all' || filters.caseType !== 'all' || filters.priority !== 'all'
                    ? 'جرب تغيير معايير البحث أو الفلترة'
                    : 'ابدأ بإنشاء قضية جديدة للحصول على استشارة قانونية'}
                </p>
                {!searchQuery && filters.status === 'all' && filters.caseType === 'all' && filters.priority === 'all' && (
                  <button
                    onClick={() => {
                      toast.success('يرجى اختيار محامي والحجز من خلاله لإنشاء قضية جديدة', {
                        duration: 4000,
                        position: 'top-center',
                        icon: '⚖️',
                      });
                      navigate('/client/search-lawyers');
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-all transform hover:scale-105 font-medium"
                  >
                    إنشاء قضية جديدة
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="mb-3 sm:mb-4 flex items-center justify-between">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    عرض <span className="font-semibold text-blue-600 dark:text-blue-400">{filteredCases.length}</span> من <span className="font-semibold">{cases.length}</span> قضية
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-500 hidden sm:inline">
                    {cases.length > 0 && `${Math.round((filteredCases.length / cases.length) * 100)}%`}
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                  {filteredCases.map((caseItem) => (
                    <CaseCard key={caseItem.case_id} caseData={caseItem} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          /* Cases Against Me Tab */
          <>
            {casesAgainstMe.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
                <AlertTriangle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  لا توجد قضايا مرفوعة ضدك
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  سيظهر هنا أي قضايا يتم رفعها ضدك وتبليغك بها
                </p>
              </div>
            ) : (
              <>
                {/* Warning Banner */}
                <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-1">تنبيه هام</h4>
                      <p className="text-sm text-orange-700 dark:text-orange-400">
                        هذه القضايا مرفوعة ضدك. ننصحك بالتواصل مع محامٍ للحصول على استشارة قانونية.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cases Against Me List */}
                <div className="space-y-4">
                  {casesAgainstMe.map((filing) => (
                    <div
                      key={filing.filing_id}
                      onClick={() => navigate(`/client/cases-against-me/${filing.case_id}`)}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(filing)}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(filing.created_at).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                            {filing.filing_summary || filing.cases?.title || 'دعوى قضائية'}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <p><span className="font-medium">المدعي:</span> {filing.plaintiff_name}</p>
                            <p><span className="font-medium">نوع القضية:</span> {filing.case_type}</p>
                            <p><span className="font-medium">المحكمة:</span> {filing.court_name}</p>
                            {filing.filing_number && (
                              <p><span className="font-medium">رقم اللائحة:</span> {filing.filing_number}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyCases;
