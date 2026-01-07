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

const LawyerCard = ({ lawyer }) => {
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
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header with Image */}
      <div className="relative h-44 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700">
        {lawyer.profile_image_url ? (
          <img
            src={lawyer.profile_image_url}
            alt={`${lawyer.first_name} ${lawyer.last_name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

        {/* Rating Badge */}
        {getRating() && (
          <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg`}>
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {getRating()}
            </span>
            <span className="text-xs text-gray-500">({lawyer.ratings_count})</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Name and Specialization */}
        <div className="mb-4 text-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {lawyer.first_name} {lawyer.last_name}
          </h3>
          {lawyer.specialization && (
            <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              {formatSpecialization(lawyer.specialization)}
            </p>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Location */}
          {lawyer.city && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-xs truncate">{lawyer.city}</span>
            </div>
          )}

          {/* Experience */}
          {lawyer.years_of_experience && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
              <Briefcase className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-xs">{lawyer.years_of_experience} سنة</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
            <Coins className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <span className="text-xs">من {getMinPrice()}</span>
          </div>

          {/* Total Cases */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
            <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <span className="text-xs">{getTotalCases()} قضية</span>
          </div>
        </div>

        {/* Services Tags */}
        {lawyer.lawyer_services && lawyer.lawyer_services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {lawyer.lawyer_services
              .filter(s => s.is_active)
              .slice(0, 2)
              .map((service) => (
                <span
                  key={service.service_id}
                  className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs rounded-full"
                >
                  {service.service_name}
                </span>
              ))}
            {lawyer.lawyer_services.filter(s => s.is_active).length > 2 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                +{lawyer.lawyer_services.filter(s => s.is_active).length - 2}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* View Profile - Primary */}
          <button
            onClick={handleViewProfile}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
          >
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">عرض الملف</span>
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSendMessage}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-medium">رسالة</span>
            </button>
            <button
              onClick={handleBookAppointment}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">موعد</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerCard;
