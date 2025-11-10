import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Briefcase, 
  Coins, 
  Star,
  Calendar,
  Eye,
  User,
  FileText
} from 'lucide-react';
import { formatSpecialization } from '../../utils/formatters';

const LawyerCard = ({ lawyer }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  // Calculate minimum price from services
  const getMinPrice = () => {
    if (!lawyer.lawyer_services || lawyer.lawyer_services.length === 0) {
      return t('searchLawyers.priceNotAvailable');
    }
    const activePrices = lawyer.lawyer_services
      .filter(s => s.is_active)
      .map(s => parseFloat(s.price));
    
    if (activePrices.length === 0) {
      return t('searchLawyers.priceNotAvailable');
    }
    
    const minPrice = Math.min(...activePrices);
    return `${minPrice} ${t('searchLawyers.currency')}`;
  };

  // Get total cases from stats
  const getTotalCases = () => {
    if (!lawyer.lawyer_stats || lawyer.lawyer_stats.length === 0) {
      return 0;
    }
    return lawyer.lawyer_stats[0].total_cases || 0;
  };

  // Calculate rating (placeholder - you can implement real rating system)
  const getRating = () => {
    // For now, return a random rating based on experience
    const experience = lawyer.years_of_experience || 0;
    if (experience >= 10) return 4.8;
    if (experience >= 5) return 4.5;
    if (experience >= 2) return 4.2;
    return 4.0;
  };

  const handleViewProfile = () => {
    navigate(`/client/lawyer/${lawyer.lawyer_id}`);
  };

  const handleBookAppointment = () => {
    navigate(`/client/book-appointment/${lawyer.lawyer_id}`);
  };

  const handleOpenCase = () => {
    navigate(`/client/create-case?lawyerId=${lawyer.lawyer_id}`);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header with Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-blue-700">
        {lawyer.profile_image_url ? (
          <img
            src={lawyer.profile_image_url}
            alt={`${lawyer.first_name} ${lawyer.last_name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-24 h-24 text-white opacity-50" />
          </div>
        )}
        
        {/* Rating Badge */}
        <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} bg-white dark:bg-gray-800 rounded-full px-3 py-1 flex items-center gap-1 shadow-lg`}>
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {getRating()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Name and Specialization */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {lawyer.first_name} {lawyer.last_name}
          </h3>
          {lawyer.specialization && (
            <p className="text-blue-600 dark:text-blue-400 font-medium">
              {formatSpecialization(lawyer.specialization)}
            </p>
          )}
        </div>

        {/* Info Grid */}
        <div className="space-y-3 mb-4">
          {/* Location */}
          {lawyer.city && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{lawyer.city}</span>
            </div>
          )}

          {/* Experience */}
          {lawyer.years_of_experience && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Briefcase className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">
                {lawyer.years_of_experience} {t('searchLawyers.yearsExperience')}
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Coins className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">
              {t('searchLawyers.startingFrom')} {getMinPrice()}
            </span>
          </div>

          {/* Total Cases */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Briefcase className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">
              {getTotalCases()} {t('searchLawyers.casesHandled')}
            </span>
          </div>
        </div>

        {/* Bio Preview */}
        {lawyer.bio && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {lawyer.bio}
          </p>
        )}

        {/* Services Tags */}
        {lawyer.lawyer_services && lawyer.lawyer_services.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {lawyer.lawyer_services
              .filter(s => s.is_active)
              .slice(0, 3)
              .map((service) => (
                <span
                  key={service.service_id}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                >
                  {service.service_name}
                </span>
              ))}
            {lawyer.lawyer_services.filter(s => s.is_active).length > 3 && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                +{lawyer.lawyer_services.filter(s => s.is_active).length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleViewProfile}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">{t('searchLawyers.viewProfile')}</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleBookAppointment}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">{t('searchLawyers.bookNow')}</span>
            </button>
            <button
              onClick={handleOpenCase}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">{t('searchLawyers.openCase')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerCard;
