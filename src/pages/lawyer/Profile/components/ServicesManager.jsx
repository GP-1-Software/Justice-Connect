import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLawyerAuth } from '../../../../hooks/useLawyerAuth';
import { supabase } from '../../../../supabaseClient';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

const ServicesManager = () => {
  const { t } = useTranslation();
  const { lawyer } = useLawyerAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    service_name: '',
    description: '',
    price: '',
    duration_minutes: '',
    is_active: true
  });

  useEffect(() => {
    let mounted = true;
    async function loadServices() {
      if (!lawyer) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lawyer_services')
          .select('*')
          .eq('lawyer_id', lawyer.lawyer_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (mounted) setServices(data || []);
      } catch (error) {
        console.warn('Services load error:', error.message);
        if (mounted) setServices([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadServices();
    return () => { mounted = false; };
  }, [lawyer]);

  const resetForm = () => {
    setFormData({
      service_name: '',
      description: '',
      price: '',
      duration_minutes: '',
      is_active: true
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!lawyer) return;

    try {
      const { data, error } = await supabase
        .from('lawyer_services')
        .insert([
          {
            lawyer_id: lawyer.lawyer_id,
            ...formData,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      setServices(prev => [data, ...prev]);
      resetForm();
      alert(t('profile.serviceAdded') || 'تمت إضافة الخدمة بنجاح');
    } catch (error) {
      console.error('Add service error:', error.message);
      alert(t('profile.serviceError') || 'حدث خطأ أثناء إضافة الخدمة');
    }
  };

  const handleEdit = async (serviceId) => {
    try {
      const { error } = await supabase
        .from('lawyer_services')
        .update(formData)
        .eq('service_id', serviceId);

      if (error) throw error;
      setServices(prev => prev.map(s => s.service_id === serviceId ? { ...s, ...formData } : s));
      resetForm();
      alert(t('profile.serviceUpdated') || 'تم تحديث الخدمة بنجاح');
    } catch (error) {
      console.error('Edit service error:', error.message);
      alert(t('profile.serviceError') || 'حدث خطأ أثناء تحديث الخدمة');
    }
  };

  const handleDelete = async (serviceId) => {
    if (!confirm(t('profile.confirmDeleteService') || 'هل أنت متأكد من حذف هذه الخدمة؟')) return;
    try {
      const { error } = await supabase
        .from('lawyer_services')
        .delete()
        .eq('service_id', serviceId);

      if (error) throw error;
      setServices(prev => prev.filter(s => s.service_id !== serviceId));
    } catch (error) {
      console.error('Delete service error:', error.message);
      alert(t('profile.deleteError') || 'حدث خطأ أثناء حذف الخدمة');
    }
  };

  const startEdit = (service) => {
    setFormData({
      service_name: service.service_name,
      description: service.description || '',
      price: service.price,
      duration_minutes: service.duration_minutes || '',
      is_active: service.is_active
    });
    setEditingId(service.service_id);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Add Service Button */}
      {!showAddForm && !editingId && (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="h-5 w-5" />
          {t('profile.addService') || 'إضافة خدمة جديدة'}
        </button>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <form onSubmit={(e) => editingId ? handleEdit(editingId) : handleAdd(e)} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingId ? t('profile.editService') || 'تعديل الخدمة' : t('profile.addNewService') || 'إضافة خدمة جديدة'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.serviceName') || 'اسم الخدمة'}
              </label>
              <input
                type="text"
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.price') || 'السعر (شيقل)'}
              </label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">₪</span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.duration') || 'المدة (دقيقة)'}
              </label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('profile.activeService') || 'خدمة نشطة'}
                </span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.description') || 'الوصف'}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Save className="h-4 w-4" />
              {editingId ? t('actions.save') || 'حفظ' : t('profile.add') || 'إضافة'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <X className="h-4 w-4" />
              {t('actions.cancel') || 'إلغاء'}
            </button>
          </div>
        </form>
      )}

      {/* Services List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('common.loading') || 'جاري التحميل...'}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('profile.noServices') || 'لا توجد خدمات مضافة بعد'}
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.service_id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {service.service_name}
                    </h4>
                    {service.is_active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-semibold">
                        {t('profile.active') || 'نشط'}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 rounded-full text-xs font-semibold">
                        {t('profile.inactive') || 'غير نشط'}
                      </span>
                    )}
                  </div>
                  {service.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      {service.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 dark:text-gray-400">{t('profile.price') || 'السعر'}:</span>
                      <span className="font-semibold text-green-600">{service.price} {t('profile.sar') || 'شيقل'}</span>
                    </div>
                    {service.duration_minutes && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 dark:text-gray-400">{t('profile.duration') || 'المدة'}:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{service.duration_minutes} {t('profile.minutes') || 'دقيقة'}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(service)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ServicesManager;
