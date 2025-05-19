import { ApiClient } from './client';
import { SearchResult, SearchOptions } from '../types/search.types';
import { ChatMessage } from '../types/chat.types';

/**
 * SearchService - Handles all search-related API operations
 * 
 * Current Date and Time: 2025-05-19 06:45:19
 * Current User: vishnutej000
 */
export class SearchService {
  /**
   * Search for messages within a specific chat
   * 
   * @param chatId - The ID of the chat to search in
   * @param query - The search query
   * @param options - Optional search parameters
   * @returns Search results
   */
  static async searchMessages(
    chatId: string, 
    query: string, 
    options?: SearchOptions
  ): Promise<SearchResult> {
    try {
      // Build query parameters
      const params: Record<string, string> = {
        query,
        ...options
      };
      
      // Make API request
      return await ApiClient.get<SearchResult>(`/chat/${chatId}/search`, { params });
    } catch (error) {
      console.error('Error searching messages:', error);
      
      // If this is a critical feature, provide fallback functionality
      if (options?.fallbackData) {
        // Use provided fallback data if available
        return createFallbackSearchResults(query, options.fallbackData);
      }
      
      // Return empty search results
      return {
        query,
        results: [],
        total_results: 0,
        total_messages_searched: 0
      };
    }
  }
  
  /**
   * Search for messages across all chats
   * 
   * @param query - The search query
   * @param options - Optional search parameters
   * @returns Search results
   */
  static async searchAllChats(
    query: string, 
    options?: SearchOptions
  ): Promise<SearchResult> {
    try {
      // Build query parameters
      const params: Record<string, string> = {
        query,
        ...options
      };
      
      // Make API request
      return await ApiClient.get<SearchResult>(`/search`, { params });
    } catch (error) {
      console.error('Error searching across all chats:', error);
      
      // If this is a critical feature, provide fallback functionality
      if (options?.fallbackData) {
        return createFallbackSearchResults(query, options.fallbackData);
      }
      
      // Return empty search results
      return {
        query,
        results: [],
        total_results: 0,
        total_messages_searched: 0
      };
    }
  }
  
  /**
   * Search for messages by content and filter by sender
   * 
   * @param chatId - The ID of the chat to search in
   * @param query - The search query
   * @param sender - The sender to filter by
   * @returns Search results
   */
  static async searchMessagesBySender(
    chatId: string, 
    query: string, 
    sender: string
  ): Promise<SearchResult> {
    return this.searchMessages(chatId, query, { sender });
  }
  
  /**
   * Search for messages within a date range
   * 
   * @param chatId - The ID of the chat to search in
   * @param query - The search query
   * @param startDate - The start date (YYYY-MM-DD)
   * @param endDate - The end date (YYYY-MM-DD)
   * @returns Search results
   */
  static async searchMessagesInDateRange(
    chatId: string, 
    query: string, 
    startDate: string, 
    endDate: string
  ): Promise<SearchResult> {
    return this.searchMessages(chatId, query, { startDate, endDate });
  }
  
  /**
   * Highlight search terms in a message
   * 
   * @param text - The message text
   * @param query - The search query
   * @returns Text with search terms highlighted
   */
  static highlightSearchTerms(text: string, query: string): string {
    if (!query || !text) return text;
    
    // Split the query into words, filtering out empty strings
    const searchTerms = query
      .split(' ')
      .filter(term => term.length > 0)
      .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // Escape regex special chars
    
    if (searchTerms.length === 0) return text;
    
    // Create a regex pattern to match any of the search terms (case insensitive)
    const pattern = new RegExp(`(${searchTerms.join('|')})`, 'gi');
    
    // Replace matching terms with highlighted versions
    return text.replace(pattern, '<mark class="bg-yellow-200 dark:bg-yellow-900">$1</mark>');
  }
}

/**
 * Create fallback search results from a set of messages
 * 
 * @param query - The search query
 * @param messages - Array of messages to search through
 * @returns SearchResult object
 */
function createFallbackSearchResults(query: string, messages: ChatMessage[]): SearchResult {
  // Perform a simple search
  const results = messages.filter(message => 
    message.text.toLowerCase().includes(query.toLowerCase())
  );
  
  return {
    query,
    results,
    total_results: results.length,
    total_messages_searched: messages.length
  };
}