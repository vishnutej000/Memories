import React, { useState, useMemo } from 'react';
import { ChatMessage } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import Button from '../UI/Button';

interface HappyMessagesProps {
  messages: ChatMessage[];
  onShare?: (message: ChatMessage) => void;
  onExport?: (messages: ChatMessage[]) => void;
}

const HappyMessages: React.FC<HappyMessagesProps> = ({ messages, onShare, onExport }) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'sentiment'>('sentiment');

  // Filter and sort happy messages
  const happyMessages = useMemo(() => {
    return messages
      .filter(msg => {
        // Exclude system messages and ensure message has content
        if (!msg.content || msg.content.includes('end-to-end encrypted')) return false;
        return msg.sentimentScore !== undefined && msg.sentimentScore > 0.5;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }
        return (b.sentimentScore || 0) - (a.sentimentScore || 0);
      });
  }, [messages, sortBy]);

  // Toggle favorite status
  const toggleFavorite = (messageId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(messageId)) {
      newFavorites.delete(messageId);
    } else {
      newFavorites.add(messageId);
    }
    setFavorites(newFavorites);
  };

  // Get favorite messages
  const favoriteMessages = useMemo(() => {
    return happyMessages.filter(msg => favorites.has(msg.id));
  }, [happyMessages, favorites]);

  if (happyMessages.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400 mb-4">
          No happy messages found. Try analyzing sentiment first!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <Button
            variant={sortBy === 'sentiment' ? 'primary' : 'secondary'}
            onClick={() => setSortBy('sentiment')}
          >
            Sort by Happiness
          </Button>
          <Button
            variant={sortBy === 'date' ? 'primary' : 'secondary'}
            onClick={() => setSortBy('date')}
          >
            Sort by Date
          </Button>
        </div>
        {favoriteMessages.length > 0 && (
          <Button
            variant="secondary"
            onClick={() => onExport?.(favoriteMessages)}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            }
          >
            Export Favorites
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {happyMessages.map(message => (
          <div
            key={message.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {message.sender}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(message.timestamp)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleFavorite(message.id)}
                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  {favorites.has(message.id) ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>
                {onShare && (
                  <button
                    onClick={() => onShare(message)}
                    className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-800 dark:text-gray-200 mb-2">{message.content}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Sentiment: {(message.sentimentScore || 0).toFixed(2)}
              </span>
              {message.isMedia && (
                <span className="text-blue-500 dark:text-blue-400">Contains media</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HappyMessages; 