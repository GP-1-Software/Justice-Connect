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

    // Fetch lawyer_stats separately for each lawyer
    const lawyersWithStats = await Promise.all(
      data.map(async (lawyer) => {
        try {
          const { data: stats, error: statsError } = await supabase
            .from('lawyer_stats')
            .select('*')
            .eq('lawyer_id', lawyer.lawyer_id)
            .maybeSingle();
          
          return {
            ...lawyer,
            lawyer_stats: stats ? [stats] : []
          };
        } catch (err) {
          // If stats not found, just return lawyer without stats
          return {
            ...lawyer,
            lawyer_stats: []
          };
        }
      })
    );

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

    // Fetch lawyer_stats separately
    const { data: stats } = await supabase
      .from('lawyer_stats')
      .select('*')
      .eq('lawyer_id', lawyerId)
      .maybeSingle();

    return {
      ...data,
      lawyer_stats: stats ? [stats] : []
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
 * @param {number} lawyerId - Lawyer ID
 * @returns {Promise<Object>} Lawyer statistics
 */
export const getLawyerStats = async (lawyerId) => {
  try {
    const { data, error } = await supabase
      .from('lawyer_stats')
      .select('*')
      .eq('lawyer_id', lawyerId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching lawyer stats:', error);
    return null;
  }
};
