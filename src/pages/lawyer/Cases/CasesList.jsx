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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0A3D91] to-[#2563eb] bg-clip-text text-transparent mb-2">
              قضاياي
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              إدارة جميع قضاياك المعينة بسهولة وبأسلوب منظم.
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:from-[#1e40af] hover:to-[#6d28d9] text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
          >
            <Plus className="h-5 w-5" />
            إضافة قضية
          </button>
        </div>

        {/* Stats Counter */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي القضايا</p>
                <p className="text-2xl font-bold text-[#0A3D91] dark:text-blue-400">{cases.length}</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">النتائج المعروضة</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{filteredCases.length}</p>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter Bar - Sticky */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن قضية بالاسم أو الرقم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm transition-all"
              />
            </div>
            <CaseFilters 
              statusFilter={statusFilter} 
              onStatusChange={setStatusFilter} 
            />
            <button
              onClick={handleRefresh}
              className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 group"
              title="تحديث"
            >
              <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Cases Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 animate-pulse">جاري تحميل القضايا...</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <EmptyState 
          hasSearch={searchQuery.trim() !== '' || statusFilter !== 'all'} 
        />
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
      )}

      {/* Footer */}
      {!loading && filteredCases.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              عرض {filteredCases.length} من {cases.length} قضية
            </span>
          </div>
        </motion.div>
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
  );
};

export default CasesList;
