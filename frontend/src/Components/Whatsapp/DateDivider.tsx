import React from 'react';

interface DateDividerProps {
  date: string;
  isKeyEvent?: boolean;
}

const DateDivider: React.FC<DateDividerProps> = ({ date, isKeyEvent = false }) => {
  // Format date
  const formatDate = (dateString: string) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if it's today
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Check if it's yesterday
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise, return formatted date
    return messageDate.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="flex items-center justify-center my-4">
      <div 
        className={`
          px-4 py-1 rounded-full text-sm text-center
          ${isKeyEvent
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 font-medium'
            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }
        `}
      >
        {formatDate(date)}
      </div>
    </div>
  );
};

export default DateDivider;