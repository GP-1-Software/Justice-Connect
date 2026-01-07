import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Upload,
  Send,
  AlertCircle,
  CheckCircle,
  Building2,
  Scale,
  Moon,
  Sun,
  Link,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { submitFiling, uploadFilingAttachments } from '../../services/courtClerkApi';

/**
 * File Case Lawyer - Electronic Filing Submission
 * Complete React conversion of the HTML filing form
 */

const FileCaseLawyer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [lawyer, setLawyer] = useState(null);

  // Linked case info (when coming from an existing case)
  const [linkedCase, setLinkedCase] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    // Court Information
    city: '',
    courtType: '',

    // Filing Information
    filingType: '',
    caseType: '',
    claimValue: '',
    relationship: '',
    caseSubject: '',
    legalRequests: '',

    // Plaintiff Information
    plaintiffName: '',
    plaintiffId: '',
    plaintiffNationality: '',
    plaintiffCapacity: '',
    plaintiffRepresentative: '',
    plaintiffAddress: '',
    plaintiffPhone: '',
    plaintiffEmail: '',
    emailNotifications: false,

    // Defendant Information
    defendantType: '',
    defendantName: '',
    defendantIdOrReg: '',
    defendantAddress: '',

    // Declaration
    declaration: false
  });

  const [attachments, setAttachments] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [courtHint, setCourtHint] = useState('');
  const [feeHint, setFeeHint] = useState('');

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Palestinian Cities
  const cities = [
    'رام الله والبيرة',
    'نابلس',
    'الخليل',
    'بيت لحم',
    'جنين',
    'طولكرم',
    'قلقيلية',
    'سلفيت',
    'طوباس والأغوار الشمالية',
    'أريحا والأغوار',
    'القدس (الشرقية)'
  ];

  // Court Types
  const courtTypes = [
    { value: 'صلح', label: 'محكمة صلح' },
    { value: 'بداية', label: 'محكمة بداية' },
    { value: 'تجارية', label: 'المحكمة التجارية' },
    { value: 'عمل', label: 'محكمة العمل' },
    { value: 'إدارية', label: 'محكمة العدل العليا (إدارية)' },
    { value: 'مستعجلة', label: 'محكمة الأمور المستعجلة' },
    { value: 'استئناف', label: 'محكمة استئناف' },
    { value: 'نقض', label: 'المحكمة العليا (نقض)' }
  ];

  // Filing Types
  const filingTypes = [
    { value: 'statement_of_claim', label: 'لائحة دعوى أصلية' },
    { value: 'defence', label: 'لائحة جوابية' },
    { value: 'urgent_request', label: 'طلب مستعجل' },
    { value: 'procedural_request', label: 'استدعاء / طلب أثناء المحاكمة' },
    { value: 'appeal', label: 'لائحة استئناف' },
    { value: 'cassation', label: 'لائحة نقض' },
    { value: 'execution_request', label: 'طلب تنفيذ حكم' },
    { value: 'other', label: 'أخرى' }
  ];

  // Case Types
  const caseTypes = [
    'مدني عام',
    'تجاري',
    'إيجارات',
    'تعويضات',
    'تنفيذ شيك/سند',
    'ملكية عقارية',
    'دعوى مستعجلة',
    'عمل',
    'أخرى'
  ];

  // Available Courts Mapping
  const availableCourts = {
    "صلح": {
      "رام الله والبيرة": "محكمة صلح رام الله",
      "نابلس": "محكمة صلح نابلس",
      "الخليل": "محكمة صلح الخليل",
      "بيت لحم": "محكمة صلح بيت لحم",
      "جنين": "محكمة صلح جنين",
      "طولكرم": "محكمة صلح طولكرم",
      "قلقيلية": "محكمة صلح قلقيلية",
      "سلفيت": "محكمة صلح سلفيت",
      "طوباس والأغوار الشمالية": "محكمة صلح طوباس",
      "أريحا والأغوار": "محكمة صلح أريحا"
    },
    "بداية": {
      "رام الله والبيرة": "محكمة بداية رام الله",
      "نابلس": "محكمة بداية نابلس",
      "الخليل": "محكمة بداية الخليل",
      "بيت لحم": "محكمة بداية بيت لحم",
      "جنين": "محكمة بداية جنين",
      "طولكرم": "محكمة بداية طولكرم",
      "قلقيلية": "محكمة بداية قلقيلية",
      "أريحا والأغوار": "محكمة بداية أريحا",
      "القدس (الشرقية)": "محكمة بداية القدس"
    },
    "تجارية": { "رام الله والبيرة": "المحكمة التجارية – رام الله" },
    "عمل": { "نابلس": "محكمة العمل – نابلس" },
    "إدارية": { "رام الله والبيرة": "محكمة العدل العليا (إدارية) – رام الله" },
    "مستعجلة": { "رام الله والبيرة": "محكمة الأمور المستعجلة – رام الله" },
    "استئناف": { "رام الله والبيرة": "محكمة استئناف رام الله" },
    "نقض": { "رام الله والبيرة": "المحكمة العليا (محكمة النقض) – رام الله" }
  };

  // Load Lawyer Data
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || storedUser.user_type !== 'lawyer') {
      toast.error('يجب تسجيل الدخول كمحامي أولاً');
      navigate('/login');
      return;
    }
    setLawyer(storedUser);
  }, [navigate]);

  // Check for linked case from URL params
  useEffect(() => {
    const caseId = searchParams.get('caseId');
    const clientId = searchParams.get('clientId');
    const title = searchParams.get('title');
    const caseType = searchParams.get('caseType');
    const description = searchParams.get('description');

    if (caseId) {
      setLinkedCase({
        caseId,
        clientId,
        title,
        caseType,
        description
      });

      // Pre-fill form data from linked case
      setFormData(prev => ({
        ...prev,
        caseSubject: title || prev.caseSubject,
        caseType: caseType || prev.caseType,
        legalRequests: description || prev.legalRequests
      }));

      toast.success('تم ربط اللائحة بالقضية الموجودة');
    }
  }, [searchParams]);

  // Update Selected Court
  useEffect(() => {
    if (formData.city && formData.courtType) {
      const court = availableCourts[formData.courtType]?.[formData.city];
      if (court) {
        setSelectedCourt(court);
        setCourtHint('');
      } else {
        setSelectedCourt(`تحذير: لا توجد محكمة ${courtTypes.find(c => c.value === formData.courtType)?.label} في ${formData.city}`);
        setCourtHint('⚠ يمكن اختيار رام الله كبَديل.');
      }
    } else {
      setSelectedCourt('← اختر المدينة ونوع المحكمة لتظهر المحكمة المختصة هنا');
      setCourtHint('');
    }
  }, [formData.city, formData.courtType]);

  // Update Fee Hint
  useEffect(() => {
    const value = parseFloat(formData.claimValue || 0);
    if (!value) {
      setFeeHint('');
      return;
    }
    if (value <= 10000) {
      setFeeHint('ملاحظة تقديرية: قد تكون الدعوى ضمن اختصاص محكمة الصلح');
    } else {
      setFeeHint('ملاحظة تقديرية: قد تكون الدعوى ضمن اختصاص محكمة البداية');
    }
  }, [formData.claimValue]);

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle File Upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  // Remove Attachment
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Validate Required Fields
  const validateForm = () => {
    const required = [
      'city', 'courtType', 'filingType', 'caseType', 'caseSubject',
      'legalRequests', 'plaintiffName', 'plaintiffPhone',
      'defendantType', 'defendantName', 'defendantAddress'
    ];

    for (const field of required) {
      if (!formData[field]) {
        toast.error('يرجى تعبئة جميع الحقول الإلزامية');
        return false;
      }
    }

    if (!formData.declaration) {
      toast.error('يجب الموافقة على الإقرار القانوني');
      return false;
    }

    return true;
  };

  // Handle Submit
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Generate temporary filing ID for uploads
      const tempFilingId = `temp-${Date.now()}`;

      // Upload attachments first (optional - won't block submission)
      let uploadedAttachments = [];
      if (attachments.length > 0) {
        try {
          toast.loading('جاري رفع المرفقات...', { id: 'upload' });
          uploadedAttachments = await uploadFilingAttachments(attachments, tempFilingId);
          if (uploadedAttachments.length > 0) {
            toast.success('تم رفع المرفقات بنجاح', { id: 'upload' });
          } else {
            toast.dismiss('upload');
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          toast.dismiss('upload');
          // Continue without attachments
        }
      }

      // Prepare data
      const data = {
        lawyerId: lawyer.lawyer_id || lawyer.user_id || lawyer.id,
        selectedCourt,
        ...formData,
        attachments: uploadedAttachments,
        // Include linked case info if available
        ...(linkedCase && {
          caseId: linkedCase.caseId,
          clientId: linkedCase.clientId
        })
      };

      // Submit to backend
      const response = await submitFiling(data);
      if (response.success) {
        toast.success('تم تقديم اللائحة بنجاح إلى قلم المحكمة');
        // Navigate to linked case if coming from one, otherwise to cases list
        if (linkedCase?.caseId) {
          navigate(`/lawyer/cases/${linkedCase.caseId}`);
        } else {
          navigate('/lawyer/cases');
        }
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'حدث خطأ أثناء تقديم اللائحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 transition-colors" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 dark:from-blue-800 dark:to-blue-600 text-white rounded-t-2xl p-8 text-center relative">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Scale className="w-10 h-10" />
            <h1 className="text-3xl font-bold">تقديم دعوى إلكترونية جديدة</h1>
          </div>
          <p className="text-blue-100 text-sm">المحاكم النظامية في الضفة الغربية – 2025</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-b-2xl shadow-lg transition-colors">
          {/* Linked Case Banner */}
          {linkedCase && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-200 dark:border-green-800 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-lg">
                  <Link className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                    هذه اللائحة مرتبطة بقضية موجودة
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    رقم القضية: #{linkedCase.caseId}
                    {linkedCase.title && ` • ${linkedCase.title}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/50 px-3 py-1.5 rounded-lg">
                  <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">مرتبطة بعميل</span>
                </div>
              </div>
            </div>
          )}

          {/* 1. Court Information */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-400 mb-4 flex items-center gap-2 border-b-2 border-blue-500 pb-2">
              <Building2 className="w-5 h-5" />
              1. بيانات المحكمة المختصة
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  المحافظة / المدينة <span className="text-red-500">*</span>
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- اختر المدينة --</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  نوع المحكمة <span className="text-red-500">*</span>
                </label>
                <select
                  name="courtType"
                  value={formData.courtType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- اختر نوع المحكمة --</option>
                  {courtTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Court Display */}
            <div className={`p-4 rounded-lg text-center font-bold ${selectedCourt.includes('تحذير')
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400'
              : selectedCourt.includes('محكمة')
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
              {selectedCourt}
            </div>
            {courtHint && (
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">{courtHint}</p>
            )}
          </div>

          {/* 2. Filing Information */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-400 mb-4 flex items-center gap-2 border-b-2 border-blue-500 pb-2">
              <FileText className="w-5 h-5" />
              2. نوع اللائحة وبيانات الدعوى
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  نوع اللائحة القانونية <span className="text-red-500">*</span>
                </label>
                <select
                  name="filingType"
                  value={formData.filingType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- اختر نوع اللائحة --</option>
                  {filingTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  نوع الدعوى <span className="text-red-500">*</span>
                </label>
                <select
                  name="caseType"
                  value={formData.caseType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- اختر نوع الدعوى --</option>
                  {caseTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  قيمة الدعوى بالشيكل (اختياري)
                </label>
                <input
                  type="number"
                  name="claimValue"
                  value={formData.claimValue}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="مثلاً: 75000"
                  min="0"
                />
                {feeHint && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{feeHint}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  طبيعة العلاقة بين الأطراف
                </label>
                <input
                  type="text"
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="مثلاً: مالك / مستأجر"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                موضوع الدعوى باختصار <span className="text-red-500">*</span>
              </label>
              <textarea
                name="caseSubject"
                value={formData.caseSubject}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="مثلاً: فسخ عقد بيع + تعويض مادي..."
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                الطلبات القانونية (ما هي طلباتك من المحكمة؟) <span className="text-red-500">*</span>
              </label>
              <textarea
                name="legalRequests"
                value={formData.legalRequests}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="1) إلزام المدعى عليه بدفع مبلغ ... 2) الرسوم والمصاريف وأتعاب المحاماة..."
                required
              />
            </div>
          </div>

          {/* 3. Plaintiff Information */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-400 mb-4 border-b-2 border-blue-500 pb-2">
              3. بيانات المدعي (الموكل)
            </h2>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  الاسم الرباعي <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="plaintiffName"
                  value={formData.plaintiffName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  رقم الهوية
                </label>
                <input
                  type="text"
                  name="plaintiffId"
                  value={formData.plaintiffId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                  maxLength="9"
                  placeholder="123456789"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  الجنسية
                </label>
                <input
                  type="text"
                  name="plaintiffNationality"
                  value={formData.plaintiffNationality}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="مثلاً: فلسطينية"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  الصفة القانونية للمدعي
                </label>
                <select
                  name="plaintiffCapacity"
                  value={formData.plaintiffCapacity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- اختر الصفة (اختياري) --</option>
                  <option value="personal">بصفته الشخصية</option>
                  <option value="guardian">ولي / وصي عن قاصر</option>
                  <option value="company_rep">ممثل عن شركة / مؤسسة</option>
                  <option value="heir">وارث / وريث شرعي</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  اسم الممثل القانوني (إن وجد)
                </label>
                <input
                  type="text"
                  name="plaintiffRepresentative"
                  value={formData.plaintiffRepresentative}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="مثلاً: بصفته وكيلاً عن شركة ...."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  عنوان المدعي
                </label>
                <input
                  type="text"
                  name="plaintiffAddress"
                  value={formData.plaintiffAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="مدينة - حي - شارع"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  رقم الجوال <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="plaintiffPhone"
                  value={formData.plaintiffPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="0599123456"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  name="plaintiffEmail"
                  value={formData.plaintiffEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={formData.emailNotifications}
                    onChange={handleChange}
                    className="w-4 h-4"
                    id="emailNotif"
                  />
                  <label htmlFor="emailNotif" className="text-sm text-gray-600 dark:text-gray-400">
                    أوافق على استلام إشعارات إلكترونية
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Defendant Information */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-400 mb-4 border-b-2 border-blue-500 pb-2">
              4. بيانات المدعى عليه
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  نوع الشخص المدعى عليه <span className="text-red-500">*</span>
                </label>
                <select
                  name="defendantType"
                  value={formData.defendantType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- اختر نوع الشخص --</option>
                  <option value="individual">فرد (شخص طبيعي)</option>
                  <option value="company">شركة / مؤسسة (شخص اعتباري)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  الاسم الرباعي أو اسم الشركة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="defendantName"
                  value={formData.defendantName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  رقم الهوية
                </label>
                <input
                  type="text"
                  name="defendantIdOrReg"
                  value={formData.defendantIdOrReg}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  عنوان المدعى عليه (للتبليغ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="defendantAddress"
                  value={formData.defendantAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="مدينة - حي - شارع"
                  required
                />
              </div>
            </div>
          </div>

          {/* 5. Attachments */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-400 mb-4 flex items-center gap-2 border-b-2 border-blue-500 pb-2">
              <Upload className="w-5 h-5" />
              5. رفع المرفقات
            </h2>

            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-2">
              المرفقات المطلوبة (PDF / صور / Word / أي مستند)
            </label>

            <div className="border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-6 text-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="fileUpload"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
              />
              <label htmlFor="fileUpload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-blue-700 dark:text-blue-400 font-semibold">اضغط لاختيار الملفات أو اسحبها هنا</p>
              </label>
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              يمكنك رفع أي نوع من المستندات المتعلقة بالدعوى (صحيفة الدعوى، وكالة المحامي، بينات، مستندات إضافية...).
            </p>
          </div>

          {/* 6. Declaration */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-400 mb-4 border-b-2 border-blue-500 pb-2">
              6. الإقرار والموافقة
            </h2>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="declaration"
                checked={formData.declaration}
                onChange={handleChange}
                className="w-5 h-5 mt-1"
                id="declaration"
              />
              <label htmlFor="declaration" className="text-gray-700 dark:text-gray-300">
                أقر بأن جميع البيانات الواردة أعلاه صحيحة، وأن المرفقات مطابقة للأصول، وأتحمل المسؤولية القانونية عن أي بيانات غير صحيحة.
              </label>
            </div>

            {!formData.declaration && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mt-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">يجب الموافقة على الإقرار قبل الإرسال.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 flex flex-wrap justify-center gap-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-blue-900 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جاري التقديم...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  تقديم الدعوى إلكترونيًا إلى قلم المحكمة
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileCaseLawyer;
