import React, { useMemo } from 'react';
import { ChatMessage } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { groupMessagesByDate } from '../../utils/messageUtils';

interface TimelineViewProps {
  messages: ChatMessage[];
  onMessageClick?: (message: ChatMessage) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ messages, onMessageClick }) => {
  // Filter out system messages
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      if (!msg.content || msg.content.includes('end-to-end encrypted')) return false;
      return true;
    });
  }, [messages]);

  // Group messages by date
  const messagesByDate = useMemo(() => {
    return groupMessagesByDate(filteredMessages);
  }, [filteredMessages]);

  // Get sorted dates
  const sortedDates = useMemo(() => {
    return Object.keys(messagesByDate).sort((a, b) => b.localeCompare(a));
  }, [messagesByDate]);

  // Find high activity days (more than 50 messages)
  const highActivityDays = useMemo(() => {
    return new Set(
      Object.entries(messagesByDate)
        .filter(([_, msgs]) => msgs.length > 50)
        .map(([date]) => date)
    );
  }, [messagesByDate]);

  // Find significant events (messages with high sentiment or media)
  const significantEvents = useMemo(() => {
    const events = new Set<string>();
    
    Object.entries(messagesByDate).forEach(([date, msgs]) => {
      const hasHighSentiment = msgs.some(msg => msg.sentimentScore && msg.sentimentScore > 0.7);
      const hasMedia = msgs.some(msg => msg.isMedia);
      
      if (hasHighSentiment || hasMedia) {
        events.add(date);
      }
    });
    
    return events;
  }, [messagesByDate]);

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
          No messages available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          There are no messages to display in the timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      
      {/* Messages */}
      <div className="space-y-8">
        {sortedDates.map(date => (
          <div key={date} className="relative">
            {/* Date header */}
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-whatsapp-teal text-white z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                  {formatDate(date)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {messagesByDate[date].length} messages
                </p>
              </div>
              
              {/* Activity indicators */}
              {highActivityDays.has(date) && (
                <div className="ml-2 px-2 py-1 text-xs font-medium text-whatsapp-teal bg-whatsapp-teal/10 rounded-full">
                  High Activity
                </div>
              )}
              {significantEvents.has(date) && (
                <div className="ml-2 px-2 py-1 text-xs font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  Significant Event
                </div>
              )}
            </div>
            
            {/* Messages for this date */}
            <div className="ml-12 space-y-4">
              {messagesByDate[date].map(message => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    message.sentimentScore && message.sentimentScore > 0.7
                      ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => onMessageClick?.(message)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {message.sender}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    {/* Message indicators */}
                    <div className="flex items-center space-x-2">
                      {message.sentimentScore && message.sentimentScore > 0.7 && (
                        <span className="text-green-600 dark:text-green-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                      )}
                      {message.isMedia && (
                        <span className="text-blue-600 dark:text-blue-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    {message.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineView; 