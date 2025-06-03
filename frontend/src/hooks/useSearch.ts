import { useState, useCallback } from 'react';
import { SearchCriteria, ChatMessage } from '../types';
import { getChat } from '../services/storageServices';

/**
 * Custom hook for searching messages in WhatsApp chats
 */
export function useSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  /**
   * Search messages based on criteria
   */
  const search = useCallback(async (criteria: SearchCriteria): Promise<void> => {
    try {
      setIsSearching(true);
      setSearchError(null);
      
      // Get the chat
      const chat = await getChat(criteria.chatId);
      
      // Filter messages based on search criteria
      let results = [...chat.messages];
      
      // Filter by query text
      if (criteria.query) {
        const query = criteria.query.toLowerCase();
        results = results.filter(message => 
          message.content.toLowerCase().includes(query)
        );
      }
      
      // Filter by sender
      if (criteria.sender) {
        results = results.filter(message => 
          message.sender === criteria.sender
        );
      }
      
      // Filter by date range
      if (criteria.dateRange) {
        const startDate = new Date(criteria.dateRange.start);
        const endDate = new Date(criteria.dateRange.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        results = results.filter(message => {
          const messageDate = new Date(message.timestamp);
          return messageDate >= startDate && messageDate <= endDate;
        });
      }
      
      // Filter by media
      if (criteria.hasMedia !== undefined) {
        results = results.filter(message => 
          message.isMedia === criteria.hasMedia
        );
      }
      
      // Filter by emoji
      if (criteria.hasEmoji !== undefined) {
        results = results.filter(message => 
          criteria.hasEmoji ? (message.emojiCount || 0) > 0 : (message.emojiCount || 0) === 0
        );
      }
      
      // Filter by sentiment
      if (criteria.sentimentRange) {
        results = results.filter(message => {
          if (message.sentimentScore === undefined) return false;
          
          const { min = -1, max = 1 } = criteria.sentimentRange || {};
          return message.sentimentScore >= min && message.sentimentScore <= max;
        });
      }
      
      // Sort by timestamp (newest first)
      results.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Update state with results
      setSearchResults(results);
      
      // Set error if no results
      if (results.length === 0) {
        setSearchError('No messages found matching your search criteria.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);
  
  return {
    search,
    searchResults,
    isSearching,
    searchError,
    clearSearch
  };
}