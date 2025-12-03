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
    <div className="max-w-6xl mx-auto">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-xl lg:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-5 lg:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">تعديل معلومات العميل</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID Number */}
            <div className="md:col-span-2">
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
                className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg sm:rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  clientIdNumber 
                    ? 'bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 cursor-not-allowed' 
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                } ${
                  idError ? 'border-red-500 focus:ring-red-500' : ''
                } text-gray-900 dark:text-white shadow-sm`}
                placeholder="123456789"
                readOnly={!!clientIdNumber}
                dir="ltr"
              />
              {idError && (
                <div className="flex items-center gap-1 mt-2 text-red-600 dark:text-red-400 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{idError}</span>
                </div>
              )}
              {!clientIdNumber && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5">
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
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
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
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
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
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                placeholder="example@email.com"
                dir="ltr"
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
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                placeholder="+970599123456"
                dir="ltr"
              />
            </div>

            {/* City */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4" />
                المدينة
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                placeholder="أدخل المدينة"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600 text-white rounded-lg sm:rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base font-medium shadow-lg hover:shadow-xl"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            {onClientAdded && (
              <button
                type="button"
                onClick={() => onClientAdded && onClientAdded()}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg sm:rounded-xl transition-all text-sm sm:text-base font-medium shadow-md hover:shadow-lg"
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientInfo;

