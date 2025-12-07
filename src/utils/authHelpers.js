// ============================================
// Auth Helpers - Utility functions for authentication
// ============================================

/**
 * Encode string to Base64 (supports Unicode/Arabic)
 * @param {string} str - String to encode
 * @returns {string} Base64 encoded string
 */
const encodeBase64 = (str) => {
    try {
        // Use TextEncoder for proper Unicode support
        const bytes = new TextEncoder().encode(str);
        const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
        return btoa(binString);
    } catch (e) {
        console.error('Base64 encoding error:', e);
        return '';
    }
};

/**
 * Get authentication headers for API requests
 * @returns {Object} Headers object with Authorization and user data
 */
export const getAuthHeaders = () => {
    const user = localStorage.getItem('user');
    const encodedUser = user ? encodeBase64(user) : '';
    
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${encodedUser}`,
        'x-user-data': encodedUser  // Must be Base64 encoded for HTTP headers
    };
};

/**
 * Get current user from localStorage
 * @returns {Object|null} User object or null if not logged in
 */
export const getCurrentUser = () => {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is logged in
 */
export const isAuthenticated = () => {
    return !!localStorage.getItem('user');
};

/**
 * Check if user has specific role
 * @param {string} role - Role to check for
 * @returns {boolean} True if user has the role
 */
export const hasRole = (role) => {
    const user = getCurrentUser();
    return user?.user_type === role;
};

export default {
    getAuthHeaders,
    getCurrentUser,
    isAuthenticated,
    hasRole
};
