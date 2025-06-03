// Date utility functions
import { format, parseISO, isValid } from 'date-fns';

/**
 * Format a date string or Date object to a readable format
 */
export function formatDate(date: string | Date, formatString: string = 'MMM dd, yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid Date';
    }
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a time string or Date object to a readable time format
 */
export function formatTime(date: string | Date, formatString: string = 'HH:mm'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid Time';
    }
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
}

/**
 * Format a date for display in the UI
 */
export function formatDisplayDate(date: string | Date): string {
  return formatDate(date, 'MMM dd, yyyy');
}

/**
 * Format a time for display in the UI
 */
export function formatDisplayTime(date: string | Date): string {
  return formatDate(date, 'h:mm a');
}

/**
 * Format a date string for the calendar
 */
export function formatCalendarDate(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid Date';
    }
    
    // Add ordinal suffix to day
    const day = dateObj.getDate();
    const ordinal = getOrdinalSuffix(day);
    
    // Format date
    const formatted = format(dateObj, 'MMMM d, yyyy');
    
    // Replace the day number with one that has an ordinal suffix
    return formatted.replace(String(day), `${day}${ordinal}`);
  } catch (error) {
    console.error('Error formatting calendar date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a full date and time for display
 */
export function formatDateTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid Date';
    }
    return format(dateObj, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid Date';
  }
}

/**
 * Get all dates between two dates (inclusive)
 */
export function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
export function getOrdinalSuffix(n: number): string {
  if (n > 3 && n < 21) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Format a date as a relative time (today, yesterday, 2 days ago, etc.)
 */
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
