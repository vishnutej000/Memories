import React from 'react';
import { format, parseISO } from 'date-fns';
import { DateRange } from '../../types/chat.types';

interface DateNavigatorProps {
  dates: DateRange[];
  selectedDate?: string;
  onSelectDate: (date: string) => void;
}

const DateNavigator: React.FC<DateNavigatorProps> = ({
  dates,
  selectedDate,
  onSelectDate
}) => {
  // Group dates by month
  const groupedDates = dates.reduce<Record<string, DateRange[]>>((acc, date) => {
    const month = date.date.substring(0, 7); // Get YYYY-MM
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(date);
    return acc;
  }, {});
  
  // Get sentiment color class
  const getSentimentColorClass = (score: number) => {
    if (score >= 0.5) return 'bg-green-500';
    if (score >= 0.2) return 'bg-green-300';
    if (score >= -0.2) return 'bg-blue-300';
    if (score >= -0.5) return 'bg-orange-300';
    return 'bg-red-400';
  };
  
  return (
    <div className="p-2 overflow-y-auto h-full">
      {Object.entries(groupedDates).map(([month, monthDates]) => (
        <div key={month} className="mb-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 px-2 mb-1">
            {format(parseISO(`${month}-01`), 'MMMM yyyy')}
          </h3>
          
          <div className="space-y-1">
            {monthDates.map((dateRange) => {
              const isSelected = dateRange.date === selectedDate;
              const dayOfMonth = parseInt(dateRange.date.split('-')[2], 10);
              
              return (
                <button
                  key={dateRange.date}
                  onClick={() => onSelectDate(dateRange.date)}
                  className={`w-full flex items-center px-2 py-1 rounded text-left text-sm transition-colors
                    ${isSelected 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'}`}
                >
                  <div className="flex flex-col items-center mr-2">
                    <span className="font-semibold">{dayOfMonth}</span>
                    <div 
                      className={`w-2 h-2 rounded-full mt-1 ${getSentimentColorClass(dateRange.sentiment_avg)}`}
                      title={`Sentiment: ${dateRange.sentiment_avg.toFixed(2)}`}
                    ></div>
                  </div>
                  <span className="text-xs">
                    {dateRange.message_count} msg
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DateNavigator;