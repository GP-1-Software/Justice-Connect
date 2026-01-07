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
  FileText,
  MessageCircle
} from 'lucide-react';
import { formatSpecialization } from '../../utils/formatters';
import { getOrCreateConversation } from '../../services/messageService';
import { useClientAuth } from '../../hooks/useClientAuth';

const LawyerCard = ({ lawyer, viewMode = 'grid' }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const { user } = useClientAuth();

  // Calculate minimum price from services
  const getMinPrice = () => {
    if (!lawyer.lawyer_services || lawyer.lawyer_services.length === 0) {
      return 'غير محدد';
    }
    const activePrices = lawyer.lawyer_services
      .filter(s => s.is_active)
      .map(s => parseFloat(s.price));

    if (activePrices.length === 0) {
      return 'غير محدد';
    }

    const minPrice = Math.min(...activePrices);
    return `${minPrice} ₪`;
  };

  // Get total cases from stats
  const getTotalCases = () => {
    if (!lawyer.lawyer_stats || lawyer.lawyer_stats.length === 0) {
      return 0;
    }
    return lawyer.lawyer_stats[0].total_cases || 0;
  };

  // Calculate rating from database
  const getRating = () => {
    if (lawyer.ratings_count && lawyer.ratings_count > 0) {
      const average = lawyer.total_ratings_sum / lawyer.ratings_count;
      return average.toFixed(1);
    }
    return null;
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const clientId = user?.id || user?.user_id;

      if (!user || !clientId) {
        alert('يجب تسجيل الدخول أولاً');
        return;
      }

      const conversation = await getOrCreateConversation(
        clientId,
        'client',
        lawyer.lawyer_id,
        'lawyer'
      );

      navigate(`/client/messages?conversation=${conversation.conversation_id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('حدث خطأ في بدء المحادثة');
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 ${isRTL ? 'rtl' : 'ltr'} ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''}`}>
      {/* Header with Image */}
      <div className={`relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 ${viewMode === 'list' ? 'h-32 sm:h-auto sm:w-40 md:w-48 flex-shrink-0' : 'h-36 sm:h-44'}`}>
        {lawyer.profile_image_url ? (
          <img
            src={lawyer.profile_image_url}
            alt={`${lawyer.first_name} ${lawyer.last_name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className={`rounded-full bg-white/20 flex items-center justify-center ${viewMode === 'list' ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-16 h-16 sm:w-20 sm:h-20'}`}>
              <User className={`text-white ${viewMode === 'list' ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10 sm:w-12 sm:h-12'}`} />
            </div>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

        {/* Rating Badge */}
        {getRating() && (
          <div className={`absolute top-2 sm:top-3 ${isRTL ? 'left-2 sm:left-3' : 'right-2 sm:right-3'} bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-1.5 shadow-lg`}>
            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
              {getRating()}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500">({lawyer.ratings_count})</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`p-3 sm:p-4 lg:p-5 ${viewMode === 'list' ? 'flex-1 flex flex-col' : ''}`}>
        {/* Name and Specialization */}
        <div className={`mb-3 ${viewMode === 'list' ? 'text-start' : 'text-center'}`}>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1 line-clamp-1">
            {lawyer.first_name} {lawyer.last_name}
          </h3>
          {lawyer.specialization && (
            <p className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-medium line-clamp-1">
              {formatSpecialization(lawyer.specialization)}
            </p>
          )}
        </div>

        {/* Info Grid */}
        <div className={`grid gap-1.5 sm:gap-2 mb-3 ${viewMode === 'list' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
          {/* Location */}
          {lawyer.city && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs truncate">{lawyer.city}</span>
            </div>
          )}

          {/* Experience */}
          {lawyer.years_of_experience && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
              <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs">{lawyer.years_of_experience} سنة</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
            <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs truncate">من {getMinPrice()}</span>
          </div>

          {/* Total Cases */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs">{getTotalCases()} قضية</span>
          </div>
        </div>

        {/* Services Tags */}
        {lawyer.lawyer_services && lawyer.lawyer_services.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3">
            {lawyer.lawyer_services
              .filter(s => s.is_active)
              .slice(0, viewMode === 'list' ? 3 : 2)
              .map((service) => (
                <span
                  key={service.service_id}
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[10px] sm:text-xs rounded-full"
                >
                  {service.service_name}
                </span>
              ))}
            {lawyer.lawyer_services.filter(s => s.is_active).length > (viewMode === 'list' ? 3 : 2) && (
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] sm:text-xs rounded-full">
                +{lawyer.lawyer_services.filter(s => s.is_active).length - (viewMode === 'list' ? 3 : 2)}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className={`space-y-2 ${viewMode === 'list' ? 'sm:flex sm:items-center sm:gap-2 sm:space-y-0 mt-auto' : ''}`}>
          {/* View Profile - Primary */}
          <button
            onClick={handleViewProfile}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg active:scale-[0.98] ${viewMode === 'list' ? 'w-full sm:w-auto sm:px-6' : 'w-full'}`}
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">عرض الملف</span>
          </button>

          {/* Secondary Actions */}
          <div className={`grid grid-cols-2 gap-1.5 sm:gap-2 ${viewMode === 'list' ? 'sm:flex' : ''}`}>
            <button
              onClick={handleSendMessage}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg sm:rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors active:scale-[0.98] ${viewMode === 'list' ? 'sm:px-4' : ''}`}
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[10px] sm:text-xs font-medium">رسالة</span>
            </button>
            <button
              onClick={handleBookAppointment}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg sm:rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors active:scale-[0.98] ${viewMode === 'list' ? 'sm:px-4' : ''}`}
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[10px] sm:text-xs font-medium">موعد</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerCard;
