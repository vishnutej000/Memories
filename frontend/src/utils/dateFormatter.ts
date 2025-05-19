import { format, parseISO, formatDistance } from 'date-fns';

/**
 * Format a date string to a human-readable format
 */
export const formatDate = (dateStr: string, formatStr: string = 'MMMM d, yyyy'): string => {
  try {
    return format(parseISO(dateStr), formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateStr;
  }
};

/**
 * Format a date string to a relative time (e.g., "2 days ago")
 */
export const formatRelativeDate = (dateStr: string): string => {
  try {
    return formatDistance(parseISO(dateStr), new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return dateStr;
  }
};

/**
 * Format a timestamp into both date and time components
 */
export const formatTimestamp = (
  timestamp: string, 
  dateFormat: string = 'MMM d, yyyy', 
  timeFormat: string = 'h:mm a'
): { date: string; time: string } => {
  try {
    const date = parseISO(timestamp);
    return {
      date: format(date, dateFormat),
      time: format(date, timeFormat),
    };
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return {
      date: '',
      time: '',
    };
  }
};

/**
 * Format a duration in seconds to a readable time format (mm:ss)
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};