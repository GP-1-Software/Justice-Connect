import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader,
  Scale,
  MapPin,
  DollarSign
} from 'lucide-react';
import {
  createCase,
  uploadCaseFile,
  getCaseTypes,
  getCasePriorities
} from '../../services/caseApi';
import { formatSpecialization } from '../../utils/formatters';
import { getLawyerById } from '../../services/lawyerApi';
import FileUploader from '../../components/client/FileUploader';

const CreateCase = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Get lawyer ID from URL if provided
  const preselectedLawyerId = searchParams.get('lawyerId');

  // State
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [files, setFiles] = useState([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    case_type: '',
    description: '',
    priority: 'normal',
    court_name: '',
    filing_date: ''
  });

  const [showTerms, setShowTerms] = useState(false);

  // Get case types and priorities
  const caseTypes = getCaseTypes();
  const casePriorities = getCasePriorities();

  // Load current user and preselected lawyer
  useEffect(() => {
    loadInitialData();
  }, [preselectedLawyerId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Get current user from localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        navigate('/login');
        return;
      }

      const userData = JSON.parse(storedUser);
      
      // Verify user is a client
      if (userData.user_type !== 'client') {
        navigate('/login');
        return;
      }

      setCurrentUser(userData);

      // Load preselected lawyer if provided
      if (preselectedLawyerId) {
        const lawyerData = await getLawyerById(parseInt(preselectedLawyerId));
        setSelectedLawyer(lawyerData);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(t('createCase.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle files change
  const handleFilesChange = (newFiles) => {
    setFiles(newFiles);
  };

  // Validate form
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError(t('createCase.titleRequired'));
      return false;
    }
    if (!formData.case_type) {
      setError(t('createCase.caseTypeRequired'));
      return false;
    }
    if (!formData.description.trim()) {
      setError(t('createCase.descriptionRequired'));
      return false;
    }
    if (!selectedLawyer) {
      setError(t('createCase.lawyerRequired'));
      return false;
    }
    if (!agreedToTerms) {
      setError(t('createCase.termsRequired'));
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Create case
      const caseData = {
        client_id: currentUser.user_id,
        assigned_lawyer_id: selectedLawyer.lawyer_id,
        title: formData.title,
        case_type: formData.case_type,
        description: formData.description,
        priority: formData.priority,
        status: 'pending',
        court_name: formData.court_name || null,
        filing_date: formData.filing_date || null
      };

      const createdCase = await createCase(caseData);

      // Upload files if any
      if (files.length > 0) {
        await Promise.all(
          files.map(file =>
            uploadCaseFile({
              file,
              case_id: createdCase.case_id,
              uploaded_by: currentUser.user_id,
              uploader_type: 'client',
              description: null
            })
          )
        );
      }

      setSuccess(true);

      // Redirect to cases page after 2 seconds
      setTimeout(() => {
        navigate('/client/cases');
      }, 2000);
    } catch (err) {
      console.error('Error creating case:', err);
      setError(t('createCase.errorCreating'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('createCase.successTitle')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('createCase.successMessage')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            {t('createCase.back')}
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('createCase.title')}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('createCase.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Selected Lawyer Card */}
          {selectedLawyer && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('createCase.selectedLawyer')}
              </h3>
              <div className="flex items-center gap-4">
                {selectedLawyer.profile_image_url ? (
                  <img
                    src={selectedLawyer.profile_image_url}
                    alt={`${selectedLawyer.first_name} ${selectedLawyer.last_name}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedLawyer.first_name} {selectedLawyer.last_name}
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {formatSpecialization(selectedLawyer.specialization)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedLawyer.years_of_experience} {t('createCase.yearsExperience')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLawyer(null);
                    navigate('/client/search-lawyers');
                  }}
                  className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  {t('createCase.changeLawyer')}
                </button>
              </div>
            </div>
          )}

          {/* Case Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5" />
              {t('createCase.caseInformation')}
            </h3>

            <div className="space-y-4">
              {/* Case Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('createCase.caseTitle')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder={t('createCase.caseTitlePlaceholder')}
                  required
                />
              </div>

              {/* Case Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('createCase.caseType')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="case_type"
                  value={formData.case_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">{t('createCase.selectCaseType')}</option>
                  {caseTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {isRTL ? type.label_ar : type.label_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('createCase.priority')}
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {casePriorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {isRTL ? priority.label_ar : priority.label_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('createCase.description')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder={t('createCase.descriptionPlaceholder')}
                  required
                />
              </div>

              {/* Court Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t('createCase.courtName')}
                </label>
                <input
                  type="text"
                  name="court_name"
                  value={formData.court_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder={t('createCase.courtNamePlaceholder')}
                />
              </div>

              {/* Filing Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t('createCase.filingDate')}
                </label>
                <input
                  type="date"
                  name="filing_date"
                  value={formData.filing_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('createCase.attachDocuments')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('createCase.attachDocumentsDescription')}
            </p>
            <FileUploader onFilesChange={handleFilesChange} maxFiles={5} maxSizeMB={10} />
          </div>

          {/* Terms and Conditions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <label className="flex items-start gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('createCase.agreeToTerms')}{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(!showTerms)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {t('createCase.termsAndConditions')}
                </button>
              </span>
            </label>

            {/* Terms Content */}
            {showTerms && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
                <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                  {t('createCase.termsTitle')}
                </h4>
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>1. {t('createCase.term1Title')}</strong><br />
                    {t('createCase.term1Content')}
                  </p>
                  <p>
                    <strong>2. {t('createCase.term2Title')}</strong><br />
                    {t('createCase.term2Content')}
                  </p>
                  <p>
                    <strong>3. {t('createCase.term3Title')}</strong><br />
                    {t('createCase.term3Content')}
                  </p>
                  <p>
                    <strong>4. {t('createCase.term4Title')}</strong><br />
                    {t('createCase.term4Content')}
                  </p>
                  <p>
                    <strong>5. {t('createCase.term5Title')}</strong><br />
                    {t('createCase.term5Content')}
                  </p>
                  <p>
                    <strong>6. {t('createCase.term6Title')}</strong><br />
                    {t('createCase.term6Content')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={submitting}
            >
              {t('createCase.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {t('createCase.submitting')}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {t('createCase.submit')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCase;
