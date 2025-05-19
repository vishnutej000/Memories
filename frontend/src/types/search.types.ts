import { ChatMessage } from './chat.types';

/**
 * Search result interface
 */
export interface SearchResult {
  query: string;
  results: ChatMessage[];
  total_results: number;
  total_messages_searched: number;
  page?: number;
  total_pages?: number;
  highlighted_terms?: string[];
}

/**
 * Search options interface
 */
export interface SearchOptions {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  sender?: string;
  messageType?: 'text' | 'media' | 'all';
  sortBy?: 'date' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
  fallbackData?: ChatMessage[]; // Used for fallback when API is unavailable
}

/**
 * Search history item interface
 */
export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string; 
  chatId?: string;
  resultCount: number;
}