import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useClientAuth } from '../../hooks/useClientAuth';
import CaseStats from '../../components/client/cases/CaseStats';
import CaseFilters from '../../components/client/cases/CaseFilters';
import CaseCard from '../../components/client/cases/CaseCard';
import CaseQuickActions from '../../components/client/cases/CaseQuickActions';
import { Loader2, AlertCircle, FolderOpen } from 'lucide-react';

const MyCases = () => {
  const { userProfile } = useClientAuth();
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    closed: 0,
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

      // Fetch cases with lawyer information
      // Search by client_id OR by client_id_number (for cases filed by lawyer)
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
      active: casesData.filter(c => c.status === 'active').length,
      pending: casesData.filter(c => c.status === 'pending').length,
      closed: casesData.filter(c => c.status === 'closed').length,
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
                onClick={() => window.location.href = '/client/cases/new'}
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
      </div>
    </div>
  );
};

export default MyCases;
