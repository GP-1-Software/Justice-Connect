import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useLawyerAuth } from '../../../hooks/useLawyerAuth';
import { supabase } from '../../../supabaseClient';
import { Search, Plus } from 'lucide-react';
import CaseCard from './components/CaseCard';
import CaseFilters from './components/CaseFilters';
import EmptyState from './components/EmptyState';
import AddCaseModal from './components/AddCaseModal';

const CasesList = () => {
  const { t } = useTranslation();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('cases.myCases') || 'قضاياي'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('cases.manageAllCases') || 'إدارة جميع قضاياك المعينة'}
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          {t('cases.addCase') || 'إضافة قضية'}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('cases.searchPlaceholder') || 'ابحث عن قضية...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <CaseFilters 
            statusFilter={statusFilter} 
            onStatusChange={setStatusFilter} 
          />
        </div>
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">{t('common.loading') || 'جاري التحميل...'}</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <EmptyState 
          hasSearch={searchQuery.trim() !== '' || statusFilter !== 'all'} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((caseItem) => (
            <CaseCard key={caseItem.id} caseData={caseItem} />
          ))}
        </div>
      )}

      {/* Cases Count */}
      {!loading && filteredCases.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {t('cases.showing') || 'عرض'} {filteredCases.length} {t('cases.of') || 'من'} {cases.length} {t('cases.cases') || 'قضية'}
        </div>
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
