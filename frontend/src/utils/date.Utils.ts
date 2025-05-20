/**
 * Utility functions for date and time operations
 */

// Format a date string to a more readable format
export function formatDate(date: string): string {
  const dateObj = new Date(date);
  
  // Add ordinal suffix to day
  const day = dateObj.getDate();
  const ordinal = getOrdinalSuffix(day);
  
  // Format date
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };
  
  const formatted = dateObj.toLocaleDateString('en-US', options);
  
  // Replace the day number with one that has an ordinal suffix
  return formatted.replace(String(day), `${day}${ordinal}`);
}

// Format a date string for the calendar
export function formatCalendarDate(date: string): string {
  const dateObj = new Date(date);
  
  // Add ordinal suffix to day
  const day = dateObj.getDate();
  const ordinal = getOrdinalSuffix(day);
  
  // Format date
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  };
  
  const formatted = dateObj.toLocaleDateString('en-US', options);
  
  // Replace the day number with one that has an ordinal suffix
  return formatted.replace(String(day), `${day}${ordinal}`);
}

// Format a timestamp to a readable time
export function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Format a timestamp to a readable date and time
export function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

// Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
export function getOrdinalSuffix(n: number): string {
  if (n > 3 && n < 21) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// Get dates between two dates (inclusive)
export function getDatesBetween(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Ensure dates are in the correct format (YYYY-MM-DD)
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  // Array to store dates
  const dates: string[] = [];
  
  // Current date
  const current = new Date(start);
  
  // Loop through dates
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Format a date as a relative time (today, yesterday, 2 days ago, etc.)
export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  // Set both dates to the start of the day for accurate day difference calculation
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Calculate the difference in days
  const diffTime = nowDay.getTime() - dateDay.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}