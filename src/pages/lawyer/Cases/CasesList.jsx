import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLawyerAuth } from '../../../hooks/useLawyerAuth';
import { supabase } from '../../../supabaseClient';
import { Search, Plus, RefreshCw } from 'lucide-react';
import CaseCard from './components/CaseCard';
import CaseFilters from './components/CaseFilters';
import EmptyState from './components/EmptyState';
import AddCaseModal from './components/AddCaseModal';

const CasesList = () => {
  const { lawyer } = useLawyerAuth();
  const location = useLocation();
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Check for ?action=new query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      setShowAddModal(true);
    }
  }, [location.search]);

  useEffect(() => {
    let mounted = true;
    async function loadCases() {
      if (!lawyer) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .eq('assigned_lawyer_id', lawyer.lawyer_id)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        if (mounted) {
          setCases(data || []);
          setFilteredCases(data || []);
        }
      } catch (error) {
        console.warn('Cases load error:', error.message);
        if (mounted) {
          setCases([]);
          setFilteredCases([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadCases();

    // Realtime subscription
    const channel = supabase
      .channel('cases-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'cases', filter: `assigned_lawyer_id=eq.${lawyer?.lawyer_id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCases(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setCases(prev => prev.map(c => c.case_id === payload.new.case_id ? payload.new : c));
          } else if (payload.eventType === 'DELETE') {
            setCases(prev => prev.filter(c => c.case_id !== payload.old.case_id));
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [lawyer]);

  // Filter cases based on search and status
  useEffect(() => {
    let filtered = cases;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.title?.toLowerCase().includes(query) ||
        c.case_number?.toLowerCase().includes(query) ||
        c.client_name?.toLowerCase().includes(query)
      );
    }

    setFilteredCases(filtered);
  }, [cases, searchQuery, statusFilter]);

  const handleRefresh = () => {
    setLoading(true);
    // Trigger reload by updating a dependency
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-3 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 sm:mb-6 lg:mb-8"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
              قضاياي
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
              إدارة جميع قضاياك المعينة بسهولة وبأسلوب منظم.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600 text-white rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base font-medium"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">إضافة قضية</span>
            <span className="sm:hidden">إضافة</span>
          </button>
        </div>

        {/* Stats Counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 sm:p-4 mb-4 sm:mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">إجمالي القضايا</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{cases.length}</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">النتائج المعروضة</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-700 dark:text-gray-300">{filteredCases.length}</p>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter Bar - Sticky */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن قضية بالاسم أو الرقم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 sm:pr-12 pl-3 sm:pl-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-all"
              />
            </div>
            <CaseFilters
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
            />
            <button
              onClick={handleRefresh}
              className="p-2 sm:p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg sm:rounded-xl transition-all duration-200 group"
              title="تحديث"
            >
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300 group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Cases Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">جاري تحميل القضايا...</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <EmptyState
          hasSearch={searchQuery.trim() !== '' || statusFilter !== 'all'}
        />
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5"
          >
            {filteredCases.map((caseItem, index) => (
              <motion.div
                key={caseItem.case_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <CaseCard
                  caseData={caseItem}
                  onCaseDeleted={(caseId) => {
                    setCases(prev => prev.filter(c => c.case_id !== caseId));
                  }}
                  onCaseUpdated={(updatedCase) => {
                    setCases(prev => prev.map(c => c.case_id === updatedCase.case_id ? updatedCase : c));
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {/* Add Case Modal */}
      <AddCaseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCaseAdded={(newCase) => {
          setCases(prev => [newCase, ...prev]);
          setShowAddModal(false);
        }}
      />
      </div>
    </div>
  );
};

export default CasesList;
