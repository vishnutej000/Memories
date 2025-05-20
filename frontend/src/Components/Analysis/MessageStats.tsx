import React from 'react';
import { WhatsAppChat } from '../../types';
import { getMostCommonWords } from '../../utils/messageUtils';
import { formatDate } from '../../utils/date.Utils';

interface MessageStatsProps {
  chat: WhatsAppChat;
}

const MessageStats: React.FC<MessageStatsProps> = ({ chat }) => {
  // Calculate averages
  const daysDiff = Math.floor(
    (new Date(chat.endDate).getTime() - new Date(chat.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  
  const avgMessagesPerDay = daysDiff > 0 ? Math.round(chat.messageCount / daysDiff) : 0;
  
  // Find the most active participant
  const messagesByParticipant: Record<string, number> = {};
  chat.participants.forEach(p => {
    messagesByParticipant[p] = chat.messages.filter(m => m.sender === p).length;
  });
  
  const mostActiveParticipant = Object.entries(messagesByParticipant)
    .sort((a, b) => b[1] - a[1])[0];
  
  // Get most common words
  const commonWords = getMostCommonWords(chat.messages, 10);

  // Get media count
  const mediaCount = chat.messages.filter(m => m.isMedia).length;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
          Chat Overview
        </h4>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Time Period</span>
            <span className="text-gray-800 dark:text-white">
              {formatDate(chat.startDate)} - {formatDate(chat.endDate)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Total Messages</span>
            <span className="text-gray-800 dark:text-white">{chat.messageCount.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Media Messages</span>
            <span className="text-gray-800 dark:text-white">{mediaCount.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Daily Average</span>
            <span className="text-gray-800 dark:text-white">{avgMessagesPerDay} messages</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Most Active</span>
            <span className="text-gray-800 dark:text-white">
              {mostActiveParticipant?.[0]} ({mostActiveParticipant?.[1]} messages)
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Participants</span>
            <span className="text-gray-800 dark:text-white">{chat.participants.length}</span>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
          Most Common Words
        </h4>
        
        {commonWords.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No word data available</p>
        ) : (
          <div className="space-y-2">
            {commonWords.map((word, index) => (
              <div key={word.word} className="flex items-center">
                <span className="w-8 text-gray-500 dark:text-gray-400">{index + 1}.</span>
                <span className="text-gray-800 dark:text-white font-medium">{word.word}</span>
                <span className="ml-auto text-gray-600 dark:text-gray-400">{word.count} times</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8">
          <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
            Fun Stats
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Characters</span>
              <span className="text-gray-800 dark:text-white">
                {chat.messages
                  .reduce((sum, msg) => sum + msg.content.length, 0)
                  .toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Emojis</span>
              <span className="text-gray-800 dark:text-white">
                {chat.messages
                  .reduce((sum, msg) => sum + (msg.emojiCount || 0), 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageStats;