import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format, parseISO, isSameDay } from 'date-fns';
import { useChat } from '../hooks/useChat';
import ChatBubble from '../components/chats/ChatBubble';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorMessage from '../components/common/ErrorMessage';

const MemoryLanePage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { 
    metadata, 
    dateRanges, 
    messages,
    loading, 
    error,
    fetchDateRanges,
    fetchMessagesByDate
  } = useChat(chatId);
  
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [yearsWithData, setYearsWithData] = useState<number[]>([]);
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [datesOnThisDay, setDatesOnThisDay] = useState<string[]>([]);
  
  // Load date ranges on mount
  useEffect(() => {
    if (chatId) {
      fetchDateRanges();
    }
  }, [chatId, fetchDateRanges]);
  
  // Extract unique years from date ranges
  useEffect(() => {
    if (dateRanges.length > 0) {
      const years = new Set<number>();
      
      dateRanges.forEach(range => {
        const year = parseInt(range.date.substring(0, 4));
        years.add(year);
      });
      
      const sortedYears = Array.from(years).sort((a, b) => b - a); // Newest first
      setYearsWithData(sortedYears);
      
      // Select the most recent year by default
      if (!selectedYear && sortedYears.length > 0) {
        setSelectedYear(sortedYears[0]);
      }
    }
  }, [dateRanges, selectedYear]);
  
  // Find dates that match current month/day in the selected year
  useEffect(() => {
    if (selectedYear && dateRanges.length > 0) {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      
      // Find all dates in the selected year with same month/day
      const matchingDates = dateRanges
        .map(range => range.date)
        .filter(dateStr => {
          const date = parseISO(dateStr);
          return (
            date.getFullYear() === selectedYear &&
            date.getMonth() + 1 === month &&
            date.getDate() === day
          );
        });
      
      setDatesOnThisDay(matchingDates);
      
      // Load messages for the first matching date
      if (matchingDates.length > 0) {
        setCurrentDate(matchingDates[0]);
        fetchMessagesByDate(matchingDates[0]);
      } else {
        setCurrentDate(null);
      }
    }
  }, [selectedYear, dateRanges, fetchMessagesByDate]);
  
  if (!chatId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            No chat selected
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Please select a chat from the sidebar or upload a new chat.
          </p>
        </div>
      </div>
    );
  }
  
  if (loading && !dateRanges.length) {
    return <LoadingScreen message="Loading memory lane..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
            Memory Lane
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Revisit your conversations from this day in previous years
          </p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {yearsWithData.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  selectedYear === year
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        
        {datesOnThisDay.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No memories for today
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              There are no messages from {selectedYear ? `${format(new Date(), 'MMMM d')} in ${selectedYear}` : 'this day in previous years'}.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {currentDate && format(parseISO(currentDate), 'EEEE, MMMM d, yyyy')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {messages.length} messages on this day
              </p>
            </div>
            
            <div className="p-6 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingScreen />
                </div>
              ) : (
                <div>
                  {messages.map(message => (
                    <ChatBubble
                      key={message.id}
                      message={message}
                      isCurrentUser={message.sender === metadata?.owner_participant}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryLanePage;