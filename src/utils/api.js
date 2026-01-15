/**
 * API Utility Functions
 * مساعدات للتعامل مع API Calls بشكل ديناميكي لدعم Mobile App
 */

/**
 * Get API Base URL from localStorage or environment variables
 * يستخدم في Mobile App لتوفير URL ديناميكي
 * @returns {string} The base API URL
 */
export const getApiBaseUrl = () => {
  // Priority: localStorage > environment variable > default
  return (
    localStorage.getItem('API_BASE_URL') ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000'
  );
};

/**
 * Make an API request with automatic base URL handling
 * @param {string} endpoint - API endpoint (e.g., '/api/lawyer/cases')
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
    }
    
    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text();
  } catch (error) {
    console.error(`API Request failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Make a GET request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
export const apiGet = (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'GET',
  });
};

/**
 * Make a POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
export const apiPost = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Make a PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
export const apiPut = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Make a PATCH request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
export const apiPatch = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * Make a DELETE request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
export const apiDelete = (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'DELETE',
  });
};

/**
 * Set API Base URL in localStorage
 * يستخدم من Mobile App لتحديد server IP
 * @param {string} url - The base URL to set
 */
export const setApiBaseUrl = (url) => {
  localStorage.setItem('API_BASE_URL', url);
};

/**
 * Clear API Base URL from localStorage
 */
export const clearApiBaseUrl = () => {
  localStorage.removeItem('API_BASE_URL');
};

// Export default object with all functions
export default {
  getApiBaseUrl,
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  setApiBaseUrl,
  clearApiBaseUrl,
};
