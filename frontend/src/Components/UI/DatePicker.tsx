import React, { useState, useEffect } from 'react';
import { getDatesBetween, formatCalendarDate } from '../../utils/date.Utils';
import Button from './Button';

interface DatePickerProps {
  startDate: string;
  endDate: string;
  onSelectDate: (date: string) => void;
  highlightDates?: string[];
  selectedDate?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  startDate,
  endDate,
  onSelectDate,
  highlightDates = [],
  selectedDate
}) => {
  // Parse dates for display
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  
  // Set current view (year/month)
  const [viewDate, setViewDate] = useState<Date>(selectedDate 
    ? new Date(selectedDate) 
    : new Date());
  
  // All available dates
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  
  // Set of dates to highlight
  const [highlightSet, setHighlightSet] = useState<Set<string>>(new Set());
  
  // Generate calendar grid for current month
  const [calendarDays, setCalendarDays] = useState<Array<{ date: Date; isInRange: boolean; isCurrentMonth: boolean }>>([]);
  
  // Initialize available dates
  useEffect(() => {
    const dates = getDatesBetween(startDate, endDate);
    setAvailableDates(dates);
    setHighlightSet(new Set(highlightDates));
  }, [startDate, endDate, highlightDates]);
  
  // Generate calendar days for current view
  useEffect(() => {
    // Get first day of current month
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    
    // Get last day of current month
    const lastDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    
    // Get day of week of first day (0-6, 0 is Sunday)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Calculate days to show from previous month
    const daysFromPrevMonth = firstDayOfWeek;
    
    // Calculate days to show from next month
    const daysInMonth = lastDayOfMonth.getDate();
    const totalDaysToShow = 42; // 6 rows x 7 days
    const daysFromNextMonth = totalDaysToShow - daysInMonth - daysFromPrevMonth;
    
    // Generate calendar days
    const days: Array<{ date: Date; isInRange: boolean; isCurrentMonth: boolean }> = [];
    
    // Add days from previous month
    const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0);
    const prevMonthDays = prevMonth.getDate();
    
    for (let i = prevMonthDays - daysFromPrevMonth + 1; i <= prevMonthDays; i++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, i);
      const dateString = date.toISOString().split('T')[0];
      const isInRange = availableDates.includes(dateString);
      
      days.push({
        date,
        isInRange,
        isCurrentMonth: false
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
      const dateString = date.toISOString().split('T')[0];
      const isInRange = availableDates.includes(dateString);
      
      days.push({
        date,
        isInRange,
        isCurrentMonth: true
      });
    }
    
    // Add days from next month
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, i);
      const dateString = date.toISOString().split('T')[0];
      const isInRange = availableDates.includes(dateString);
      
      days.push({
        date,
        isInRange,
        isCurrentMonth: false
      });
    }
    
    setCalendarDays(days);
  }, [viewDate, availableDates]);
  
  // Navigate to previous month
  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };
  
  // Check if previous month button should be disabled
  const isPrevMonthDisabled = () => {
    const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    return prevMonth < new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
  };
  
  // Check if next month button should be disabled
  const isNextMonthDisabled = () => {
    const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    return nextMonth > new Date(endDateObj.getFullYear(), endDateObj.getMonth(), 1);
  };
  
  // Format month name
  const formatMonth = (date: Date) => {
    return date.toLocaleString('default', { month: 'long' });
  };
  
  // Check if a date is highlighted
  const isHighlighted = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return highlightSet.has(dateString);
  };
  
  // Check if a date is selected
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toISOString().split('T')[0] === selectedDate;
  };
  
  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  return (
    <div className="space-y-4">
      {/* Month/year navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          disabled={isPrevMonthDisabled()}
          className={`p-1 rounded-full ${
            isPrevMonthDisabled()
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-lg font-semibold text-gray-800 dark:text-white">
          {formatMonth(viewDate)} {viewDate.getFullYear()}
        </div>
        
        <button
          onClick={goToNextMonth}
          disabled={isNextMonthDisabled()}
          className={`p-1 rounded-full ${
            isNextMonthDisabled()
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Calendar grid */}
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={() => day.isInRange && onSelectDate(day.date.toISOString().split('T')[0])}
              disabled={!day.isInRange}
              className={`
                flex items-center justify-center h-10 w-full rounded-full text-sm font-medium transition-colors
                ${!day.isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-200'}
                ${day.isInRange ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700' : 'opacity-50 cursor-not-allowed'}
                ${isSelected(day.date) ? 'bg-whatsapp-dark text-white dark:bg-whatsapp-light dark:text-gray-900' : ''}
                ${isToday(day.date) && !isSelected(day.date) ? 'border border-whatsapp-dark dark:border-whatsapp-light' : ''}
                ${isHighlighted(day.date) && !isSelected(day.date) ? 'bg-whatsapp-light/10 dark:bg-whatsapp-dark/20' : ''}
              `}
            >
              <span>{day.date.getDate()}</span>
              {isHighlighted(day.date) && (
                <span className="absolute bottom-0.5 w-1 h-1 bg-whatsapp-dark dark:bg-whatsapp-light rounded-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center">
          <div className="w-4 h-4 border border-whatsapp-dark dark:border-whatsapp-light rounded-full mr-2"></div>
          <span>Today</span>
        </div>
        
        <div className="flex items-center">
          <div className="w-4 h-4 bg-whatsapp-light/10 dark:bg-whatsapp-dark/20 rounded-full mr-2"></div>
          <span>Days with journal entries</span>
        </div>
      </div>
      
      {/* Current date info */}
      {selectedDate && (
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
          <p className="text-center text-gray-700 dark:text-gray-300">
            Selected: <span className="font-medium">{formatCalendarDate(selectedDate)}</span>
          </p>
        </div>
      )}
      
      {/* Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={() => onSelectDate(new Date().toISOString().split('T')[0])}
          variant="outline"
          size="small"
        >
          Today
        </Button>
        
        <Button
          onClick={() => onSelectDate(selectedDate || viewDate.toISOString().split('T')[0])}
          variant="primary"
          size="small"
        >
          Select
        </Button>
      </div>
    </div>
  );
};

export default DatePicker;