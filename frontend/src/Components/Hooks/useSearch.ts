import { useState, useCallback } from 'react';
import { ChatMessage, SearchCriteria } from '../../types';
import { messageService } from '../../services/MessageService';

interface UseSearchProps {
  chatId: string;
}

export function useSearch({ chatId }: UseSearchProps) {
  const [query, setQuery] = useState('');
  const [sender, setSender] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string } | null>(null);
  const [hasMedia, setHasMedia] = useState<boolean | undefined>(undefined);
  const [hasEmoji, setHasEmoji] = useState<boolean | undefined>(undefined);
  const [sentimentRange, setSentimentRange] = useState<{ min?: number; max?: number } | undefined>(undefined);
  
  const [results, setResults] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Perform search with current criteria
  const search = useCallback(async () => {
    if (!chatId) {
      setError('No chat selected');
      return;
    }
    
    if (!query && !sender && !dateRange && hasMedia === undefined && hasEmoji === undefined && !sentimentRange) {
      setError('Please specify at least one search criterion');
      return;
    }
    
    try {
      setIsSearching(true);
      setError(null);
      
      // Create search criteria
      const criteria: SearchCriteria = {
        chatId,
        query: query || undefined,
        sender,
        dateRange: dateRange && (dateRange.start || dateRange.end)
          ? {
              start: dateRange.start || '',
              end: dateRange.end || ''
            }
          : undefined,
        hasMedia,
        hasEmoji,
        sentimentRange      };
      
      // Perform search
      const searchResults = await messageService.searchMessages(criteria);
      setResults(searchResults);
      
      // Clear error if search was successful
      setError(null);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during search');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [chatId, query, sender, dateRange, hasMedia, hasEmoji, sentimentRange]);
  
  // Reset search
  const resetSearch = useCallback(() => {
    setQuery('');
    setSender(undefined);
    setDateRange(null);
    setHasMedia(undefined);
    setHasEmoji(undefined);
    setSentimentRange(undefined);
    setResults([]);
    setError(null);
  }, []);
  
  return {
    // State
    query,
    sender,
    dateRange,
    hasMedia,
    hasEmoji,
    sentimentRange,
    results,
    isSearching,
    error,
    
    // Setters
    setQuery,
    setSender,
    setDateRange,
    setHasMedia,
    setHasEmoji,
    setSentimentRange,
    
    // Actions
    search,
    resetSearch
  };
}