import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Video, 
  MessageSquare,
  CreditCard,
  Check,
  ArrowRight,
  ArrowLeft,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useClientAuth } from '../../hooks/useClientAuth';
import { createAppointment } from '../../services/appointmentApi';
import { getLawyerAvailableSlots } from '../../services/lawyerApi';
import { formatSpecialization } from '../../utils/formatters';

const BookAppointment = () => {
  const { lawyerId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useClientAuth();
  
  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('consultation');
  const [meetingMethod, setMeetingMethod] = useState('video_call');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [booking, setBooking] = useState(false);

  // Fetch lawyer data from database
  useEffect(() => {
    const fetchLawyer = async () => {
      try {
        // Fetch lawyer basic info
        const { data: lawyerData, error: lawyerError } = await supabase
          .from('lawyers')
          .select('lawyer_id, first_name, last_name, specialization, city, phone, bio, profile_image_url, years_of_experience')
          .eq('lawyer_id', parseInt(lawyerId))
          .single();

        if (lawyerError) {
          console.error('Error fetching lawyer:', lawyerError);
          setLoading(false);
          return;
        }

        // Fetch lawyer services (for pricing)
        const { data: servicesData, error: servicesError } = await supabase
          .from('lawyer_services')
          .select('*')
          .eq('lawyer_id', parseInt(lawyerId))
          .eq('is_active', true);

        if (servicesError) {
          console.error('Error fetching services:', servicesError);
        }

        // Attach services to lawyer data
        setLawyer({
          ...lawyerData,
          services: servicesData || []
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching lawyer:', error);
        setLoading(false);
      }
    };

    if (lawyerId) {
      fetchLawyer();
    }
  }, [lawyerId]);

  // Fetch available time slots from database
  const fetchAvailableSlots = async (date) => {
    try {
      const slots = await getLawyerAvailableSlots(lawyerId, date);
      return slots;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return [];
    }
  };

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    setSelectedTime('');
    const slots = await fetchAvailableSlots(date);
    setAvailableSlots(slots);
  };

  const calculateTotal = () => {
    if (!lawyer || !lawyer.services) return 0;
    
    // Find the selected service
    const selectedService = lawyer.services.find(s => s.service_name === appointmentType);
    if (selectedService) {
      return parseFloat(selectedService.price);
    }
    
    // Fallback: calculate based on duration if no service found
    return 0;
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !userProfile?.user_id) {
      alert('يرجى اختيار التاريخ والوقت');
      return;
    }

    setBooking(true);
    
    try {
      const appointmentData = {
        client_id: userProfile.user_id,
        lawyer_id: lawyerId,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        duration_minutes: duration,
        appointment_type: appointmentType,
        meeting_method: meetingMethod,
        status: 'pending',
        price: calculateTotal(),
        notes: notes
      };

      await createAppointment(appointmentData);
      
      alert('تم حجز الموعد بنجاح!');
      navigate('/client/appointments');
    } catch (error) {
      console.error('Booking error:', error);
      alert('حدث خطأ في حجز الموعد');
    } finally {
      setBooking(false);
    }
  };

  const appointmentTypes = [
    { value: 'consultation', label: 'استشارة', duration: 30, price: 75 },
    { value: 'case_review', label: 'مراجعة قضية', duration: 60, price: 150 },
    { value: 'document_review', label: 'مراجعة وثائق', duration: 45, price: 112 }
  ];

  const meetingMethods = [
    { value: 'video_call', label: 'مكالمة فيديو', icon: Video },
    { value: 'in_person', label: 'شخصي', icon: User },
    { value: 'phone_call', label: 'مكالمة هاتفية', icon: Phone }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">المحامي غير موجود</h2>
          <button 
            onClick={() => navigate('/client/search-lawyers')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            العودة للبحث
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          <span>رجوع</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            حجز موعد
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            احجز موعد مع {lawyer.first_name} {lawyer.last_name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lawyer Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sticky top-8">
              <div className="text-center mb-6">
                {lawyer.profile_image_url ? (
                  <img
                    src={lawyer.profile_image_url}
                    alt={`${lawyer.first_name} ${lawyer.last_name}`}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-blue-500"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <User className="h-12 w-12 text-white" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {lawyer.first_name} {lawyer.last_name}
                </h3>
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  {formatSpecialization(lawyer.specialization)}
                </p>
                {lawyer.years_of_experience && (
                  <div className="flex items-center justify-center mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {lawyer.years_of_experience} سنوات خبرة
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {lawyer.city && (
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {lawyer.city}
                    </span>
                  </div>
                )}
                {lawyer.phone && (
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {lawyer.phone}
                    </span>
                  </div>
                )}
                {lawyer.services && lawyer.services.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">الخدمات المتاحة:</div>
                    <div className="space-y-1">
                      {lawyer.services.slice(0, 3).map((service) => (
                        <div key={service.service_id} className="flex justify-between text-xs">
                          <span className="text-gray-700 dark:text-gray-300">{service.service_name}</span>
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">{service.price} ₪</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              {/* Step 1: Select Appointment Type */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      اختر نوع الموعد
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      حدد نوع الخدمة التي تحتاجها
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {lawyer.services && lawyer.services.length > 0 ? (
                      lawyer.services.map((service) => (
                        <button
                          key={service.service_id}
                          onClick={() => {
                            setAppointmentType(service.service_name);
                            setDuration(service.duration_minutes);
                            setCurrentStep(2);
                          }}
                          className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition text-right"
                        >
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            {service.service_name}
                          </h3>
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {service.description && (
                              <div className="text-xs mb-2">{service.description}</div>
                            )}
                            <div>المدة: {service.duration_minutes} دقيقة</div>
                            <div className="text-blue-600 dark:text-blue-400 font-semibold">
                              {service.price} ₪
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                          لا توجد خدمات متاحة حالياً
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Select Date and Time */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>العودة</span>
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      اختر التاريخ والوقت
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        اختر التاريخ
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    {/* Time Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        اختر الوقت
                      </label>
                      {selectedDate ? (
                        availableSlots.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                            {availableSlots.map((slot, index) => {
                              // Check if time has passed (only for today)
                              const isToday = selectedDate === new Date().toISOString().split('T')[0];
                              const now = new Date();
                              const currentHour = now.getHours();
                              const currentMinute = now.getMinutes();
                              
                              // Parse slot time (format: "HH:MM")
                              const [slotHour, slotMinute] = slot.time.split(':').map(Number);
                              const slotTotalMinutes = slotHour * 60 + slotMinute;
                              const currentTotalMinutes = currentHour * 60 + currentMinute;
                              
                              const isPast = isToday && slotTotalMinutes <= currentTotalMinutes;
                              
                              return (
                                <button
                                  key={index}
                                  onClick={() => !isPast && setSelectedTime(slot.time)}
                                  disabled={isPast}
                                  className={`p-3 text-sm rounded-lg border transition ${
                                    isPast
                                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-red-300 dark:border-red-900 cursor-not-allowed'
                                      : selectedTime === slot.time
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:border-blue-500'
                                  }`}
                                >
                                  <div className={isPast ? 'line-through' : ''}>
                                    {slot.display || slot.time}
                                  </div>
                                  {isPast && <div className="text-xs mt-1 font-semibold text-red-600 dark:text-red-400">(انقضى)</div>}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                              لا توجد أوقات متاحة في هذا اليوم
                            </p>
                          </div>
                        )
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          اختر التاريخ أولاً
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedDate && selectedTime && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 space-x-reverse"
                      >
                        <span>متابعة</span>
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Meeting Method and Confirmation */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>العودة</span>
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      تأكيد الموعد
                    </h2>
                  </div>

                  {/* Meeting Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      طريقة الاجتماع
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {meetingMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <button
                            key={method.value}
                            onClick={() => setMeetingMethod(method.value)}
                            className={`p-4 border-2 rounded-xl transition text-right ${
                              meetingMethod === method.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                            }`}
                          >
                            <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400 mb-2" />
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {method.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ملاحظات إضافية
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="أي ملاحظات إضافية..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Appointment Summary */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      ملخص الموعد
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">التاريخ:</span>
                        <span className="text-gray-900 dark:text-white">{selectedDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">الوقت:</span>
                        <span className="text-gray-900 dark:text-white">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">المدة:</span>
                        <span className="text-gray-900 dark:text-white">{duration} دقيقة</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">طريقة الاجتماع:</span>
                        <span className="text-gray-900 dark:text-white">
                          {meetingMethods.find(m => m.value === meetingMethod)?.label}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-4">
                        <div className="flex justify-between text-lg font-semibold">
                          <span className="text-gray-900 dark:text-white">المجموع:</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {calculateTotal().toFixed(2)} ₪
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Book Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleBooking}
                      disabled={booking}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {booking ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>جاري الحجز...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>تأكيد الحجز</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
