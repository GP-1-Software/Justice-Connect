import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, CreditCard, Save, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../../../supabaseClient';
import { validatePalestinianID, formatPalestinianID } from '../../../../utils/idValidation';

const AddClientInfo = ({ clientIdNumber, caseNumber, lawyerId, onClientAdded }) => {
  const [loading, setLoading] = useState(false);
  const [idError, setIdError] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    city: '',
    id_number: clientIdNumber || ''
  });

  // Load existing data if available
  useEffect(() => {
    const loadExistingData = async () => {
      if (clientIdNumber || caseNumber) {
        try {
          // Try to fetch existing data from user_details
          let query = supabase.from('user_details').select('*');
          
          if (clientIdNumber) {
            query = query.eq('id_number', clientIdNumber);
          } else if (caseNumber) {
            query = query.eq('case_number', caseNumber);
          }
          
          const { data, error } = await query.maybeSingle();
          
          if (data && !error) {
            setFormData({
              first_name: data.first_name || '',
              last_name: data.last_name || '',
              email: data.email || '',
              phone_number: data.phone_number || '',
              city: data.city || '',
              id_number: data.id_number || clientIdNumber || ''
            });
          }
        } catch (err) {
          console.log('No existing data found, starting fresh');
        }
      }
    };
    
    loadExistingData();
  }, [clientIdNumber, caseNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate ID number
    if (formData.id_number) {
      const validation = validatePalestinianID(formData.id_number);
      if (!validation.isValid) {
        setIdError(validation.error);
        return;
      }
    }
    
    setLoading(true);

    try {
      // Insert directly into user_details table (no users table interaction)
      const { data, error: detailsError } = await supabase
        .from('user_details')
        .upsert({
          id_number: formData.id_number || null,
          first_name: formData.first_name.trim() ? formData.first_name : null,
          last_name: formData.last_name.trim() ? formData.last_name : null,
          email: formData.email.trim() ? formData.email : null,
          lawyer_id: lawyerId,
          case_number: caseNumber,
          phone_number: formData.phone_number.trim() ? formData.phone_number : null,
          city: formData.city.trim() ? formData.city : null
        }, {
          onConflict: 'id_number'
        })
        .select()
        .single();

      if (detailsError) {
        console.error('User details insert error:', detailsError);
        throw detailsError;
      }

      alert('تم حفظ معلومات العميل بنجاح');
      
      // Notify parent to refresh
      if (onClientAdded) {
        onClientAdded(data);
      }
    } catch (error) {
      console.error('Error adding client info:', error);
      alert('حدث خطأ أثناء إضافة معلومات العميل: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear ID error when user starts typing
    if (name === 'id_number') {
      setIdError('');
    }
  };

  const handleIdBlur = () => {
    if (formData.id_number.trim()) {
      const validation = validatePalestinianID(formData.id_number);
      if (!validation.isValid) {
        setIdError(validation.error);
      } else {
        setIdError('');
        // Auto-format the ID
        setFormData({
          ...formData,
          id_number: formatPalestinianID(formData.id_number)
        });
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-xl lg:rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">تعديل معلومات العميل</h3>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ID Number */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <CreditCard className="w-4 h-4" />
            رقم الهوية
          </label>
          <input
            type="text"
            name="id_number"
            value={formData.id_number}
            onChange={handleChange}
            onBlur={handleIdBlur}
            maxLength="9"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
              clientIdNumber 
                ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600' 
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
            } ${
              idError ? 'border-red-500 focus:ring-red-500' : ''
            } text-gray-900 dark:text-white`}
            placeholder="123456789"
            readOnly={!!clientIdNumber}
            dir="ltr"
          />
          {idError && (
            <div className="flex items-center gap-1 mt-1 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>{idError}</span>
            </div>
          )}
          {!clientIdNumber && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              9 أرقام للهوية الفلسطينية
            </p>
          )}
        </div>

        {/* First Name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <User className="w-4 h-4" />
            الاسم الأول
          </label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="أدخل الاسم الأول"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <User className="w-4 h-4" />
            الاسم الأخير
          </label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="أدخل الاسم الأخير"
          />
        </div>

        {/* Email */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Mail className="w-4 h-4" />
            البريد الإلكتروني
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="example@email.com"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Phone className="w-4 h-4" />
            رقم الهاتف
          </label>
          <input
            type="tel"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            pattern="[0-9+\-\s()]+"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="+970599123456"
            dir="ltr"
          />
        </div>

        {/* City */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin className="w-4 h-4" />
            المدينة
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="أدخل المدينة"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddClientInfo;
