import React, { useMemo } from 'react';
import { ChatMessage } from '../../types';
import { getMostCommonWords } from '../../utils/messageUtils';
import { formatDate } from '../../utils/dateUtils';

interface DailyInsightProps {
  messages: ChatMessage[];
  date: string;
}

const DailyInsight: React.FC<DailyInsightProps> = ({ messages, date }) => {
  // Calculate insights based on messages
  const insights = useMemo(() => {
    if (!messages.length) {
      return {
        totalMessages: 0,
        messagesByParticipant: {},
        mostCommonWords: [],
        mediaCount: 0,
        charactersTyped: 0,
        emojiCount: 0,
        timeDistribution: {} as Record<string, number>
      };
    }
    
    // Count messages by participant
    const messagesByParticipant: Record<string, number> = {};
    messages.forEach(msg => {
      messagesByParticipant[msg.sender] = (messagesByParticipant[msg.sender] || 0) + 1;
    });
    
    // Count media messages
    const mediaCount = messages.filter(msg => msg.isMedia).length;
    
    // Count characters
    const charactersTyped = messages.reduce((total, msg) => total + msg.content.length, 0);
    
    // Count emojis
    const emojiCount = messages.reduce((total, msg) => total + (msg.emojiCount || 0), 0);
    
    // Get time distribution
    const timeDistribution: Record<string, number> = {
      'Morning (6AM-12PM)': 0,
      'Afternoon (12PM-5PM)': 0,
      'Evening (5PM-10PM)': 0,
      'Night (10PM-6AM)': 0
    };
    
    messages.forEach(message => {
      const date = new Date(message.timestamp);
      const hour = date.getHours();
      
      if (hour >= 6 && hour < 12) {
        timeDistribution['Morning (6AM-12PM)'] += 1;
      } else if (hour >= 12 && hour < 17) {
        timeDistribution['Afternoon (12PM-5PM)'] += 1;
      } else if (hour >= 17 && hour < 22) {
        timeDistribution['Evening (5PM-10PM)'] += 1;
      } else {
        timeDistribution['Night (10PM-6AM)'] += 1;
      }
    });
    
    return {
      totalMessages: messages.length,
      messagesByParticipant,
      mostCommonWords: getMostCommonWords(messages, 5),
      mediaCount,
      charactersTyped,
      emojiCount,
      timeDistribution
    };
  }, [messages]);
  
  // If no messages, show placeholder
  if (messages.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No messages on this day</h3>
        <p className="text-gray-500 dark:text-gray-400">
          There were no messages exchanged on {formatDate(date)}.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-5 space-y-5">
      {/* Message stats */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase">
          Message Stats
        </h4>
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Total Messages</span>
            <span className="font-medium text-gray-800 dark:text-white">{insights.totalMessages}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Media Shared</span>
            <span className="font-medium text-gray-800 dark:text-white">{insights.mediaCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Characters Typed</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {insights.charactersTyped.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Emojis Used</span>
            <span className="font-medium text-gray-800 dark:text-white">{insights.emojiCount}</span>
          </div>
        </div>
      </div>
      
      {/* Participant activity */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase">
          Who Was Active
        </h4>
        <div className="space-y-2">
          {Object.entries(insights.messagesByParticipant).map(([participant, count]) => (
            <div key={participant} className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300 truncate" title={participant}>
                {participant.length > 15 ? `${participant.substring(0, 15)}...` : participant}
              </span>
              <span className="font-medium text-gray-800 dark:text-white">
                {count} ({Math.round((count / insights.totalMessages) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Common words */}
      {insights.mostCommonWords.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase">
            Most Used Words
          </h4>
          <div className="flex flex-wrap gap-2">
            {insights.mostCommonWords.map(({ word, count }) => (
              <div 
                key={word} 
                className="bg-white dark:bg-gray-600 px-2 py-1 rounded-md text-sm"
              >
                <span className="text-gray-700 dark:text-gray-200">{word}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">({count})</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Time distribution */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase">
          When You Chatted
        </h4>
        <div className="space-y-2">
          {Object.entries(insights.timeDistribution)
            .filter(([_, count]) => count > 0)
            .sort(([_, countA], [__, countB]) => countB - countA)
            .map(([period, count]) => (
              <div key={period} className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">{period}</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {count} ({Math.round((count / insights.totalMessages) * 100)}%)
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DailyInsight;