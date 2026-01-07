import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Star,
  Calendar,
  Phone,
  Mail,
  Award,
  Clock,
  Coins,
  User,
  Loader,
  AlertCircle,
  CheckCircle,
  FileText,
  X
} from 'lucide-react';
import { getLawyerById, getLawyerAvailableSlots, rateLawyer, removeRating } from '../../services/lawyerApi';
import { formatSpecialization } from '../../utils/formatters';

const LawyerProfile = () => {
  const { lawyerId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Rating states
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [previousRating, setPreviousRating] = useState(null); // Stores user's previous rating (null if never rated)

  // Check if user already rated this lawyer and get previous rating
  useEffect(() => {
    const lawyerRatings = JSON.parse(localStorage.getItem('lawyerRatings') || '{}');
    const prevRating = lawyerRatings[lawyerId];
    setPreviousRating(prevRating || null);
  }, [lawyerId]);

  useEffect(() => {
    loadLawyerData();
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, [lawyerId]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  const loadLawyerData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLawyerById(parseInt(lawyerId));
      setLawyer(data);

      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    } catch (err) {
      console.error('Error loading lawyer:', err);
      setError(t('lawyerProfile.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const slots = await getLawyerAvailableSlots(parseInt(lawyerId), selectedDate);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error loading slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookAppointment = () => {
    navigate(`/client/book-appointment/${lawyerId}`);
  };

  const handleOpenCase = () => {
    navigate(`/client/create-case?lawyerId=${lawyerId}`);
  };

  // Handle rating submission (supports re-rating)
  const handleRating = async (rating) => {
    try {
      setRatingSubmitting(true);
      // Pass previous rating if re-rating
      await rateLawyer(parseInt(lawyerId), rating, previousRating);

      // Save rating to localStorage
      const lawyerRatings = JSON.parse(localStorage.getItem('lawyerRatings') || '{}');
      lawyerRatings[lawyerId] = rating;
      localStorage.setItem('lawyerRatings', JSON.stringify(lawyerRatings));
      setPreviousRating(rating);

      setRatingSuccess(true);
      // Reload lawyer data to get updated rating
      await loadLawyerData();
      setTimeout(() => setRatingSuccess(false), 3000);
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('حدث خطأ في التقييم');
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Handle removing rating
  const handleRemoveRating = async () => {
    if (!previousRating) return;

    try {
      setRatingSubmitting(true);
      await removeRating(parseInt(lawyerId), previousRating);

      // Remove from localStorage
      const lawyerRatings = JSON.parse(localStorage.getItem('lawyerRatings') || '{}');
      delete lawyerRatings[lawyerId];
      localStorage.setItem('lawyerRatings', JSON.stringify(lawyerRatings));
      setPreviousRating(null);

      // Reload lawyer data
      await loadLawyerData();
    } catch (err) {
      console.error('Error removing rating:', err);
      alert('حدث خطأ في حذف التقييم');
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Get current average rating
  const getAverageRating = () => {
    if (lawyer?.ratings_count && lawyer.ratings_count > 0) {
      return (lawyer.total_ratings_sum / lawyer.ratings_count).toFixed(1);
    }
    return null;
  };

  const getDayName = (dayKey) => {
    const dayMap = {
      'sunday': t('lawyerProfile.sunday'),
      'monday': t('lawyerProfile.monday'),
      'tuesday': t('lawyerProfile.tuesday'),
      'wednesday': t('lawyerProfile.wednesday'),
      'thursday': t('lawyerProfile.thursday'),
      'friday': t('lawyerProfile.friday'),
      'saturday': t('lawyerProfile.saturday')
    };
    return dayMap[dayKey] || dayKey;
  };

  // Convert schedule JSONB to array for display
  const getScheduleArray = (schedule) => {
    if (!schedule) return [];

    const daysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    return daysOrder
      .filter(day => schedule[day] && schedule[day].enabled)
      .map(day => ({
        day,
        start: schedule[day].start,
        end: schedule[day].end
      }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !lawyer) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('lawyerProfile.notFound')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/client/search-lawyers')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('lawyerProfile.backToSearch')}
          </button>
        </div>
      </div>
    );
  }

  const stats = lawyer.lawyer_stats?.[0] || {};

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            {t('lawyerProfile.back')}
          </button>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {lawyer.profile_image_url ? (
                <img
                  src={lawyer.profile_image_url}
                  alt={`${lawyer.first_name} ${lawyer.last_name}`}
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {lawyer.first_name} {lawyer.last_name}
              </h1>
              {lawyer.specialization && (
                <p className="text-xl text-blue-600 dark:text-blue-400 font-medium mb-4">
                  {formatSpecialization(lawyer.specialization)}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mb-4">
                {lawyer.city && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-5 h-5" />
                    <span>{lawyer.city}</span>
                  </div>
                )}
                {lawyer.years_of_experience && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Briefcase className="w-5 h-5" />
                    <span>{lawyer.years_of_experience} {t('lawyerProfile.yearsExperience')}</span>
                  </div>
                )}
                {lawyer.license_number && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Award className="w-5 h-5" />
                    <span>{t('lawyerProfile.license')}: {lawyer.license_number}</span>
                  </div>
                )}
              </div>

              {/* Rating Section */}
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Rating Label */}
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    التقييم:
                  </span>

                  {/* Average Rating Display */}
                  {getAverageRating() && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {getAverageRating()}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({lawyer?.ratings_count || 0} تقييم)
                      </span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>

                  {/* Rate Stars */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {previousRating ? 'تقييمك:' : 'قيّم المحامي:'}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          disabled={ratingSubmitting}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => handleRating(star)}
                          className="p-0.5 transition-transform hover:scale-125 disabled:opacity-50"
                        >
                          <Star
                            className={`w-6 h-6 cursor-pointer transition-colors ${star <= (hoverRating || previousRating || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300 dark:text-gray-500 hover:text-yellow-300'
                              }`}
                          />
                        </button>
                      ))}
                    </div>
                    {/* Remove Rating Button */}
                    {previousRating && !ratingSubmitting && (
                      <button
                        onClick={handleRemoveRating}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="حذف التقييم"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {ratingSubmitting && (
                      <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                    )}
                    {ratingSuccess && (
                      <span className="text-green-600 text-sm">✓ شكراً!</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleBookAppointment}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  {t('lawyerProfile.bookAppointment')}
                </button>
                <button
                  onClick={handleOpenCase}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  {t('lawyerProfile.openCase')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('lawyerProfile.statistics')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.total_cases || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('lawyerProfile.totalCases')}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.active_cases || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('lawyerProfile.activeCases')}
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.completed_cases || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('lawyerProfile.completedCases')}
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.total_appointments || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('lawyerProfile.appointments')}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {lawyer.bio && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {t('lawyerProfile.about')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {lawyer.bio}
                </p>
              </div>
            )}

            {/* Services */}
            {lawyer.lawyer_services && lawyer.lawyer_services.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {t('lawyerProfile.services')}
                </h2>
                <div className="space-y-4">
                  {lawyer.lawyer_services
                    .filter(s => s.is_active)
                    .map((service) => (
                      <div
                        key={service.service_id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {service.service_name}
                          </h3>
                          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
                            <Coins className="w-5 h-5" />
                            {service.price} ₪
                          </div>
                        </div>
                        {service.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                          <Clock className="w-4 h-4" />
                          {service.duration_minutes} {t('lawyerProfile.minutes')}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Availability Schedule */}
            {lawyer.lawyer_availability && lawyer.lawyer_availability.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {t('lawyerProfile.workingHours')}
                </h2>
                <div className="space-y-3">
                  {lawyer.lawyer_availability && lawyer.lawyer_availability.length > 0 && lawyer.lawyer_availability[0].schedule ? (
                    getScheduleArray(lawyer.lawyer_availability[0].schedule).map((daySchedule, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {getDayName(daySchedule.day)}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {daySchedule.start} - {daySchedule.end}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {t('lawyerProfile.noScheduleAvailable')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('lawyerProfile.checkAvailability')}
              </h2>

              {/* Date Picker */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('lawyerProfile.selectDate')}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Available Slots */}
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : availableSlots.length > 0 ? (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {t('lawyerProfile.availableSlots')}:
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {availableSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="p-2 text-center border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-sm"
                      >
                        {slot.display}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {t('lawyerProfile.noSlotsAvailable')}
                  </p>
                </div>
              )}

              <button
                onClick={handleBookAppointment}
                className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                {t('lawyerProfile.bookNow')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerProfile;
