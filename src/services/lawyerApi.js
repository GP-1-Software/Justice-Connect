import { supabase } from '../supabaseClient';

/**
 * Search and filter lawyers with advanced options
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} List of lawyers
 */
export const searchLawyers = async (filters = {}) => {
  try {
    let query = supabase
      .from('lawyers')
      .select(`
        *,
        lawyer_services (
          service_id,
          service_name,
          description,
          price,
          duration_minutes,
          is_active
        )
      `)
      .eq('account_status', 'approved');

    // Search by name
    if (filters.searchTerm) {
      query = query.or(`first_name.ilike.%${filters.searchTerm}%,last_name.ilike.%${filters.searchTerm}%`);
    }

    // Filter by specialization
    if (filters.specialization && filters.specialization !== 'all') {
      query = query.eq('specialization', filters.specialization);
    }

    // Filter by city
    if (filters.city && filters.city !== 'all') {
      query = query.eq('city', filters.city);
    }

    // Filter by years of experience
    if (filters.minExperience) {
      query = query.gte('years_of_experience', filters.minExperience);
    }
    if (filters.maxExperience) {
      query = query.lte('years_of_experience', filters.maxExperience);
    }

    // Filter by price range (from services)
    // Note: This will be handled in post-processing since it's in related table

    // Sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'experience_desc':
          query = query.order('years_of_experience', { ascending: false });
          break;
        case 'experience_asc':
          query = query.order('years_of_experience', { ascending: true });
          break;
        case 'name_asc':
          query = query.order('first_name', { ascending: true });
          break;
        case 'name_desc':
          query = query.order('first_name', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    // Add empty lawyer_stats for compatibility
    const lawyersWithStats = data.map(lawyer => ({
      ...lawyer,
      lawyer_stats: []
    }));

    // Post-process for price filtering
    let filteredData = lawyersWithStats;
    if (filters.minPrice || filters.maxPrice) {
      filteredData = lawyersWithStats.filter(lawyer => {
        if (!lawyer.lawyer_services || lawyer.lawyer_services.length === 0) return false;

        const prices = lawyer.lawyer_services
          .filter(s => s.is_active)
          .map(s => parseFloat(s.price));

        if (prices.length === 0) return false;

        const minServicePrice = Math.min(...prices);

        if (filters.minPrice && minServicePrice < filters.minPrice) return false;
        if (filters.maxPrice && minServicePrice > filters.maxPrice) return false;

        return true;
      });
    }

    // Sort by price if requested
    if (filters.sortBy === 'price_asc' || filters.sortBy === 'price_desc') {
      filteredData = filteredData.sort((a, b) => {
        const pricesA = a.lawyer_services?.filter(s => s.is_active).map(s => parseFloat(s.price)) || [];
        const pricesB = b.lawyer_services?.filter(s => s.is_active).map(s => parseFloat(s.price)) || [];

        const minA = pricesA.length > 0 ? Math.min(...pricesA) : Infinity;
        const minB = pricesB.length > 0 ? Math.min(...pricesB) : Infinity;

        return filters.sortBy === 'price_asc' ? minA - minB : minB - minA;
      });
    }

    return filteredData;
  } catch (error) {
    console.error('Error searching lawyers:', error);
    throw error;
  }
};

/**
 * Get lawyer by ID with full details
 * @param {number} lawyerId - Lawyer ID
 * @returns {Promise<Object>} Lawyer details
 */
export const getLawyerById = async (lawyerId) => {
  try {
    const { data, error } = await supabase
      .from('lawyers')
      .select(`
        *,
        lawyer_services (
          service_id,
          service_name,
          description,
          price,
          duration_minutes,
          is_active
        ),
        lawyer_availability (
          availability_id,
          schedule
        )
      `)
      .eq('lawyer_id', lawyerId)
      .single();

    if (error) throw error;

    // Return lawyer with empty stats (lawyer_stats table not used)
    return {
      ...data,
      lawyer_stats: []
    };
  } catch (error) {
    console.error('Error fetching lawyer:', error);
    throw error;
  }
};

/**
 * Get available time slots for a lawyer on a specific date
 * @param {number} lawyerId - Lawyer ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Available time slots
 */
export const getLawyerAvailableSlots = async (lawyerId, date) => {
  try {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

    // Map day number to day name
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    // Get lawyer's availability schedule
    const { data: availability, error: availError } = await supabase
      .from('lawyer_availability')
      .select('schedule')
      .eq('lawyer_id', lawyerId)
      .single();

    if (availError) throw availError;

    if (!availability || !availability.schedule || !availability.schedule[dayName]) {
      return [];
    }

    const daySchedule = availability.schedule[dayName];

    // Check if this day is enabled
    if (!daySchedule.enabled) {
      return [];
    }

    // Get existing appointments for this date
    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('appointment_time, duration_minutes')
      .eq('lawyer_id', lawyerId)
      .eq('appointment_date', date)
      .in('status', ['pending', 'confirmed']);

    if (apptError) throw apptError;

    // Generate time slots
    const slots = [];
    const startTime = daySchedule.start;
    const endTime = daySchedule.end;

    // Parse times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeSlot = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}:00`;

      // Check if this slot is booked
      const isBooked = appointments?.some(apt => {
        const aptTime = apt.appointment_time;
        const aptDuration = apt.duration_minutes || 60;

        // Check if slot overlaps with appointment
        const slotTime = currentHour * 60 + currentMin;
        const [aptHour, aptMin] = aptTime.split(':').map(Number);
        const aptStartTime = aptHour * 60 + aptMin;
        const aptEndTime = aptStartTime + aptDuration;

        return slotTime >= aptStartTime && slotTime < aptEndTime;
      });

      if (!isBooked) {
        slots.push({
          time: timeSlot,
          display: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
          available: true
        });
      }

      // Move to next 30-minute slot
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour += 1;
      }
    }

    return slots;
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw error;
  }
};

/**
 * Get all unique specializations
 * @returns {Promise<Array>} List of specializations
 */
export const getSpecializations = async () => {
  try {
    const { data, error } = await supabase
      .from('lawyers')
      .select('specialization')
      .eq('account_status', 'approved')
      .not('specialization', 'is', null);

    if (error) throw error;

    // Get unique specializations
    const specializations = [...new Set(data.map(item => item.specialization))];
    return specializations.filter(s => s); // Remove null/undefined
  } catch (error) {
    console.error('Error fetching specializations:', error);
    throw error;
  }
};

/**
 * Get all unique cities
 * @returns {Promise<Array>} List of cities
 */
export const getCities = async () => {
  try {
    const { data, error } = await supabase
      .from('lawyers')
      .select('city')
      .eq('account_status', 'approved')
      .not('city', 'is', null);

    if (error) throw error;

    // Get unique cities
    const cities = [...new Set(data.map(item => item.city))];
    return cities.filter(c => c); // Remove null/undefined
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
};

/**
 * Get lawyer statistics
 * Note: lawyer_stats table is not used - returns null
 * @param {number} lawyerId - Lawyer ID
 * @returns {Promise<Object>} Lawyer statistics (always null)
 */
export const getLawyerStats = async (lawyerId) => {
  // lawyer_stats table doesn't exist - return null
  return null;
};

/**
 * Rate a lawyer (supports re-rating)
 * @param {number} lawyerId - Lawyer ID
 * @param {number} rating - Rating value (1-5)
 * @param {number|null} previousRating - Previous rating if re-rating (null for first rating)
 * @returns {Promise<Object>} Updated lawyer data
 */
export const rateLawyer = async (lawyerId, rating, previousRating = null) => {
  try {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // First, get current ratings
    const { data: lawyer, error: fetchError } = await supabase
      .from('lawyers')
      .select('total_ratings_sum, ratings_count')
      .eq('lawyer_id', lawyerId)
      .single();

    if (fetchError) throw fetchError;

    let newSum, newCount;

    if (previousRating !== null) {
      // Re-rating: subtract old rating, add new one (count stays same)
      newSum = (lawyer.total_ratings_sum || 0) - previousRating + rating;
      newCount = lawyer.ratings_count || 1; // Count doesn't change
    } else {
      // First rating
      newSum = (lawyer.total_ratings_sum || 0) + rating;
      newCount = (lawyer.ratings_count || 0) + 1;
    }

    // Update lawyer with new rating
    const { data, error } = await supabase
      .from('lawyers')
      .update({
        total_ratings_sum: newSum,
        ratings_count: newCount
      })
      .eq('lawyer_id', lawyerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error rating lawyer:', error);
    throw error;
  }
};

/**
 * Get lawyer's average rating
 * @param {number} lawyerId - Lawyer ID
 * @returns {Promise<number|null>} Average rating or null
 */
export const getLawyerRating = async (lawyerId) => {
  try {
    const { data, error } = await supabase
      .from('lawyers')
      .select('total_ratings_sum, ratings_count')
      .eq('lawyer_id', lawyerId)
      .single();

    if (error) throw error;

    if (!data.ratings_count || data.ratings_count === 0) {
      return null;
    }

    return data.total_ratings_sum / data.ratings_count;
  } catch (error) {
    console.error('Error fetching lawyer rating:', error);
    return null;
  }
};

/**
 * Remove user's rating from a lawyer
 * @param {number} lawyerId - Lawyer ID
 * @param {number} previousRating - The rating to remove
 * @returns {Promise<Object>} Updated lawyer data
 */
export const removeRating = async (lawyerId, previousRating) => {
  try {
    // Get current ratings
    const { data: lawyer, error: fetchError } = await supabase
      .from('lawyers')
      .select('total_ratings_sum, ratings_count')
      .eq('lawyer_id', lawyerId)
      .single();

    if (fetchError) throw fetchError;

    // Subtract the rating
    const newSum = Math.max(0, (lawyer.total_ratings_sum || 0) - previousRating);
    const newCount = Math.max(0, (lawyer.ratings_count || 0) - 1);

    // Update lawyer
    const { data, error } = await supabase
      .from('lawyers')
      .update({
        total_ratings_sum: newSum,
        ratings_count: newCount
      })
      .eq('lawyer_id', lawyerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error removing rating:', error);
    throw error;
  }
};
