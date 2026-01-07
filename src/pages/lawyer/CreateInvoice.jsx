import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoiceOperations } from '../../hooks/useInvoices';
import { calculateInvoiceTotals } from '../../services/invoiceService';
import { supabase } from '../../supabaseClient';
import { useLawyerAuth } from '../../hooks/useLawyerAuth';
import {
  Plus,
  Trash2,
  Save,
  X,
  User,
  FileText,
  Calendar,
  DollarSign,
  Percent,
  Tag,
  Search
} from 'lucide-react';

/**
 * Create Invoice Page for Lawyers
 */
const CreateInvoice = () => {
  const navigate = useNavigate();
  const { create, loading } = useInvoiceOperations();
  const { lawyer } = useLawyerAuth(); // ✅ Get logged-in lawyer

  // Get lawyer ID from auth context
  const lawyerId = lawyer?.lawyer_id;

  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    case_id: '',
    appointment_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    tax_percentage: 0,
    discount_amount: 0,
    currency: 'ILS',
    notes: '',
    terms_conditions: 'يرجى الدفع خلال المدة المحددة. في حالة التأخير، قد تطبق رسوم إضافية.'
  });

  // Search fields
  const [searchCaseNumber, setSearchCaseNumber] = useState('');
  const [searchAppointmentNumber, setSearchAppointmentNumber] = useState('');

  // Track if valid data was found from search
  const [isValidSearch, setIsValidSearch] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const [items, setItems] = useState([
    { description: '', quantity: 1, unit_price: 0, total_price: 0, item_order: 0 }
  ]);

  // Dropdown data
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Calculated totals
  const [totals, setTotals] = useState({
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0
  });

  // Fetch clients, cases, and appointments
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch lawyer's clients (from appointments or cases)
        const { data: clientsData } = await supabase
          .from('users')
          .select('user_id, first_name, last_name, email')
          .eq('user_type', 'client');

        setClients(clientsData || []);

        // Fetch lawyer's cases
        const { data: casesData } = await supabase
          .from('cases')
          .select('case_id, title, case_number, client_id')
          .eq('assigned_lawyer_id', lawyerId);

        setCases(casesData || []);

        // Fetch lawyer's appointments
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select('id, appointment_number, appointment_date, client_id')
          .eq('lawyer_id', lawyerId);

        setAppointments(appointmentsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [lawyerId]);

  // Search and auto-fill by case number or filing number
  const handleCaseNumberSearch = async (caseNumber) => {
    setSearchCaseNumber(caseNumber);
    if (!caseNumber.trim()) return;

    // Check if lawyer ID is available
    if (!lawyerId) {
      alert('⚠️ جارٍ تحميل بيانات المحامي... يرجى المحاولة مرة أخرى');
      return;
    }

    try {
      // Remove # if present
      const cleanCaseNumber = caseNumber.replace(/^#/, '').trim();

      console.log('🔍 البحث عن قضية:', {
        originalInput: caseNumber,
        cleanedInput: cleanCaseNumber,
        lawyerId: lawyerId
      });

      // Check if it's a filing number (starts with FILING-)
      const isFilingNumber = cleanCaseNumber.toUpperCase().startsWith('FILING-');

      let caseData = null;
      let foundViaFiling = false;

      if (isFilingNumber) {
        // Search in court_clerk_filings table first
        console.log('🔍 البحث برقم اللائحة في court_clerk_filings...');
        const { data: filingData, error: filingError } = await supabase
          .from('court_clerk_filings')
          .select('filing_id, case_id, client_id, filing_number, plaintiff_name, defendant_name, case_type')
          .eq('filing_number', cleanCaseNumber)
          .eq('lawyer_id', lawyerId)
          .single();

        if (!filingError && filingData) {
          console.log('✅ تم العثور على اللائحة:', filingData);
          foundViaFiling = true;
          
          // If filing has a linked case_id, get case details
          if (filingData.case_id) {
            const { data: linkedCase } = await supabase
              .from('cases')
              .select('case_id, title, case_number, client_id')
              .eq('case_id', filingData.case_id)
              .single();
            
            if (linkedCase) {
              caseData = linkedCase;
            }
          }
          
          // If no linked case, use filing data directly
          if (!caseData) {
            caseData = {
              case_id: filingData.case_id,
              client_id: filingData.client_id,
              title: `${filingData.case_type} - ${filingData.plaintiff_name} ضد ${filingData.defendant_name}`,
              filing_number: filingData.filing_number
            };
          }
        }
      }

      // If not found via filing, search in cases table
      if (!caseData) {
        const { data: casesResult, error } = await supabase
          .from('cases')
          .select('case_id, title, case_number, client_id')
          .eq('case_number', cleanCaseNumber)
          .eq('assigned_lawyer_id', lawyerId)
          .single();

        if (!error && casesResult) {
          caseData = casesResult;
        }
      }

      // If still not found, try searching filings by case_id match in cases
      if (!caseData && !isFilingNumber) {
        // Try to find if this case_number exists in filings
        const { data: filingByCase } = await supabase
          .from('court_clerk_filings')
          .select('filing_id, case_id, client_id, filing_number, case_type, plaintiff_name, defendant_name')
          .eq('lawyer_id', lawyerId)
          .or(`filing_number.ilike.%${cleanCaseNumber}%,official_case_number.eq.${cleanCaseNumber},registry_number.eq.${cleanCaseNumber}`)
          .limit(1)
          .single();

        if (filingByCase) {
          foundViaFiling = true;
          caseData = {
            case_id: filingByCase.case_id,
            client_id: filingByCase.client_id,
            title: `${filingByCase.case_type} - ${filingByCase.plaintiff_name} ضد ${filingByCase.defendant_name}`,
            filing_number: filingByCase.filing_number
          };
        }
      }

      if (!caseData) {
        console.error('❌ لم يتم العثور على القضية أو اللائحة');
        setIsValidSearch(false);
        setSearchPerformed(true);
        alert(`❌ لم يتم العثور على القضية أو اللائحة "${cleanCaseNumber}"\nتأكد من:\n1. الرقم صحيح\n2. القضية/اللائحة موجودة\n3. مسندة لك`);
        return;
      }

      console.log('✅ تم العثور على القضية:', caseData, foundViaFiling ? '(عبر اللائحة)' : '(مباشرة)');
      setFormData(prev => ({
        ...prev,
        case_id: caseData.case_id,
        client_id: caseData.client_id,
        appointment_id: '' // Clear appointment if case is selected
      }));
      // Clear appointment search field
      setSearchAppointmentNumber('');
      // Mark search as valid
      setIsValidSearch(true);
      setSearchPerformed(true);
      alert(`✅ تم العثور على القضية: ${caseData.title}${foundViaFiling ? '\n(تم العثور عليها من خلال رقم اللائحة)' : ''}`);
    } catch (error) {
      console.error('💥 خطأ غير متوقع:', error);
      alert('حدث خطأ غير متوقع. راجع Console.');
    }
  };

  // Search and auto-fill by appointment number
  const handleAppointmentNumberSearch = async (appointmentNumber) => {
    setSearchAppointmentNumber(appointmentNumber);
    if (!appointmentNumber.trim()) return;

    // Check if lawyer ID is available
    if (!lawyerId) {
      alert('⚠️ جارٍ تحميل بيانات المحامي... يرجى المحاولة مرة أخرى');
      return;
    }

    try {
      // Remove # if present
      const cleanAppointmentNumber = appointmentNumber.replace(/^#/, '').trim();

      console.log('🔍 البحث عن موعد:', {
        originalInput: appointmentNumber,
        cleanedInput: cleanAppointmentNumber,
        lawyerId: lawyerId
      });

      const { data: appointmentData, error } = await supabase
        .from('appointments')
        .select('id, appointment_number, appointment_date, client_id, case_id, price')
        .eq('appointment_number', cleanAppointmentNumber)
        .eq('lawyer_id', lawyerId)
        .single();

      if (error) {
        console.error('❌ خطأ في البحث:', error);
        console.log('تفاصيل الخطأ:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        // Mark search as invalid
        setIsValidSearch(false);
        setSearchPerformed(true);
        alert(`❌ لم يتم العثور على الموعد "${cleanAppointmentNumber}"\nتأكد من:\n1. الرقم صحيح\n2. الموعد موجود\n3. الموعد مسند لك`);
        return;
      }

      if (appointmentData) {
        console.log('✅ تم العثور على الموعد:', appointmentData);
        setFormData(prev => ({
          ...prev,
          appointment_id: appointmentData.id,
          client_id: appointmentData.client_id,
          case_id: appointmentData.case_id || ''
        }));

        // Auto-add appointment price as first item if available
        if (appointmentData.price) {
          setItems([{
            description: `موعد - ${appointmentData.appointment_number}`,
            quantity: 1,
            unit_price: parseFloat(appointmentData.price),
            total_price: parseFloat(appointmentData.price),
            item_order: 0
          }]);
        }

        // Clear case search if appointment is selected
        setSearchCaseNumber('');
        // Mark search as valid
        setIsValidSearch(true);
        setSearchPerformed(true);
        alert(`✅ تم العثور على الموعد: ${appointmentData.appointment_number}`);
      }
    } catch (error) {
      console.error('💥 خطأ غير متوقع:', error);
      alert('حدث خطأ غير متوقع. راجع Console.');
    }
  };

  // Calculate totals whenever items or tax/discount changes
  useEffect(() => {
    const calculated = calculateInvoiceTotals(
      items,
      formData.tax_percentage,
      formData.discount_amount
    );
    setTotals(calculated);
  }, [items, formData.tax_percentage, formData.discount_amount]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle item change
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Calculate total price for this item
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const unitPrice = parseFloat(newItems[index].unit_price) || 0;
      newItems[index].total_price = quantity * unitPrice;
    }

    setItems(newItems);
  };

  // Add new item
  const addItem = () => {
    setItems([
      ...items,
      {
        description: '',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        item_order: items.length
      }
    ]);
  };

  // Remove item
  const removeItem = (index) => {
    if (items.length === 1) {
      alert('يجب أن تحتوي الفاتورة على بند واحد على الأقل');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Must search and find valid case or appointment first
    if (!isValidSearch) {
      alert('⚠️ يجب البحث عن رقم قضية أو موعد صحيح أولاً!\n\nأدخل رقم القضية أو الموعد في حقل البحث للمتابعة.');
      return;
    }

    // Validation
    if (!formData.client_id) {
      alert('يرجى اختيار العميل');
      return;
    }

    if (!formData.due_date) {
      alert('يرجى تحديد تاريخ الاستحقاق');
      return;
    }

    if (items.some(item => !item.description || item.unit_price <= 0)) {
      alert('يرجى ملء جميع بنود الفاتورة بشكل صحيح');
      return;
    }

    // Prepare invoice data
    const invoiceData = {
      lawyer_id: lawyerId,
      client_id: parseInt(formData.client_id),
      case_id: formData.case_id ? parseInt(formData.case_id) : null,
      appointment_id: formData.appointment_id || null,
      subtotal: totals.subtotal,
      tax_percentage: parseFloat(formData.tax_percentage) || 0,
      tax_amount: totals.taxAmount,
      discount_amount: parseFloat(formData.discount_amount) || 0,
      total_amount: totals.totalAmount,
      currency: formData.currency,
      status: 'pending',
      issue_date: formData.issue_date,
      due_date: formData.due_date,
      notes: formData.notes,
      terms_conditions: formData.terms_conditions
    };

    // Create invoice
    const { data, error } = await create(invoiceData, items);

    if (error) {
      alert('حدث خطأ أثناء إنشاء الفاتورة');
      console.error(error);
      return;
    }

    alert('تم إنشاء الفاتورة بنجاح');
    navigate('/lawyer/invoices');
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إنشاء فاتورة جديدة</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">قم بإنشاء فاتورة جديدة لعملائك</p>
            </div>
            <button
              onClick={() => navigate('/lawyer/invoices')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
              <span>إلغاء</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              معلومات أساسية
            </h2>

            {/* Quick Search Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                <Search className="w-4 h-4" />
                بحث برقم القضية أو الموعد
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search by Case Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رقم القضية
                  </label>
                  <input
                    type="text"
                    value={searchCaseNumber}
                    onChange={(e) => handleCaseNumberSearch(e.target.value)}
                    placeholder="أدخل رقم القضية للبحث التلقائي"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Search by Appointment Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رقم الموعد
                  </label>
                  <input
                    type="text"
                    value={searchAppointmentNumber}
                    onChange={(e) => handleAppointmentNumberSearch(e.target.value)}
                    placeholder="أدخل رقم الموعد للبحث التلقائي"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Search Status Indicator */}
              {searchPerformed && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${isValidSearch
                  ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300'
                  }`}>
                  {isValidSearch ? (
                    <>
                      <span className="text-2xl">✅</span>
                      <span className="font-semibold">تم العثور على البيانات بنجاح! يمكنك المتابعة.</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">❌</span>
                      <span className="font-semibold">لم يتم العثور على بيانات. يرجى إدخال رقم صحيح.</span>
                    </>
                  )}
                </div>
              )}

            </div>

            {/* Hidden fields - Auto-filled from search */}
            <input type="hidden" name="client_id" value={formData.client_id} required />
            <input type="hidden" name="case_id" value={formData.case_id} />
            <input type="hidden" name="appointment_id" value={formData.appointment_id} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  العملة
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ILS">شيكل (₪ ILS)</option>
                </select>
              </div>

              {/* Issue Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تاريخ الإصدار <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="issue_date"
                  value={formData.issue_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تاريخ الاستحقاق <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  required
                  min={formData.issue_date}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                بنود الفاتورة
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                إضافة بند
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        الوصف
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="وصف الخدمة..."
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Quantity */}
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        الكمية
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        min="1"
                        step="1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div> */}

                    {/* Unit Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        السعر
                      </label>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        min="0"
                        step="0.01"
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Total and Delete */}
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.total_price.toFixed(2)} {formData.currency}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calculations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              الحسابات
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tax Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نسبة الضريبة (%)
                </label>
                <input
                  type="number"
                  name="tax_percentage"
                  value={formData.tax_percentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الخصم ({formData.currency})
                </label>
                <input
                  type="number"
                  name="discount_amount"
                  value={formData.discount_amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Totals Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>المجموع الفرعي:</span>
                <span className="font-medium">{totals.subtotal.toFixed(2)} {formData.currency}</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>الضريبة ({formData.tax_percentage}%):</span>
                <span className="font-medium">{totals.taxAmount.toFixed(2)} {formData.currency}</span>
              </div>
              {formData.discount_amount > 0 && (
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>الخصم:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    -{parseFloat(formData.discount_amount).toFixed(2)} {formData.currency}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-blue-600 dark:text-blue-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span>المجموع الإجمالي:</span>
                <span>{totals.totalAmount.toFixed(2)} {formData.currency}</span>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">ملاحظات وشروط</h2>

            <div className="space-y-4">
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ملاحظات للعميل
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="أي ملاحظات إضافية..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الشروط والأحكام
                </label>
                <textarea
                  name="terms_conditions"
                  value={formData.terms_conditions}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !isValidSearch}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              title={!isValidSearch ? 'يجب البحث عن رقم قضية أو موعد صحيح أولاً' : ''}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>جاري الإنشاء...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isValidSearch ? 'إنشاء الفاتورة' : '🔒 ابحث عن قضية أو موعد أولاً'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/lawyer/invoices')}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoice;
