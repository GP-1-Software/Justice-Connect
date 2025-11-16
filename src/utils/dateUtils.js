// Simple date utilities for Arabic locale
export const formatTimeAgo = (timestamp) => {
  try {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'منذ لحظات';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `منذ ${diffInMinutes} دقيقة`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `منذ ${diffInHours} ساعة`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `منذ ${diffInDays} يوم`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `منذ ${diffInWeeks} أسبوع`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    return `منذ ${diffInMonths} شهر`;
  } catch (error) {
    return 'منذ وقت قصير';
  }
};

export const formatDate = (timestamp, options = {}) => {
  try {
    const date = new Date(timestamp);
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      calendar: 'gregory'
    };
    
    return date.toLocaleDateString('ar-JO', { ...defaultOptions, ...options });
  } catch (error) {
    return 'تاريخ غير صحيح';
  }
};

export const formatDateTime = (timestamp) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('ar-JO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      calendar: 'gregory'
    });
  } catch (error) {
    return 'تاريخ غير صحيح';
  }
};

export const isToday = (timestamp) => {
  try {
    const today = new Date();
    const date = new Date(timestamp);
    return date.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};

export const isTomorrow = (timestamp) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = new Date(timestamp);
    return date.toDateString() === tomorrow.toDateString();
  } catch (error) {
    return false;
  }
};

export const isYesterday = (timestamp) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = new Date(timestamp);
    return date.toDateString() === yesterday.toDateString();
  } catch (error) {
    return false;
  }
};




