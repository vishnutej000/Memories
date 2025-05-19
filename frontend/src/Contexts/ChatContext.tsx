import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { ChatService } from '../api/chat.service';
import { SearchService } from '../api/search.service';
import { ChatFile, ChatMessage, ChatMetadata, DateRange } from '../types/chat.types';
import { SearchResult } from '../types/search.types';
import { generateMockChats, generateMockChatData } from '../utils/fallbackData';

// Current Date and Time: 2025-05-19 06:51:12
// Current User: vishnutej000

interface ChatContextType {
  // States
  activeChats: ChatFile[];
  selectedChat: ChatMetadata | null;
  dateRanges: DateRange[];
  messages: Record<string, ChatMessage[]>;
  currentMessages: ChatMessage[];
  currentDate: string | null;
  searchResults: SearchResult | null;
  isLoading: boolean;
  error: string | null;
  apiConnected: boolean;
  
  // Actions
  fetchChats: () => Promise<void>;
  selectChat: (chatId: string) => Promise<ChatMetadata | null>;
  fetchMessagesByDate: (date: string) => Promise<ChatMessage[]>;
  fetchMessagesForDateRange: (startDate: string, endDate: string) => Promise<ChatMessage[]>;
  searchMessages: (query: string, chatId?: string) => Promise<SearchResult>;
  fetchDateRanges: (chatId: string) => Promise<DateRange[]>;
  uploadChat: (file: File, onProgress?: (progress: number) => void) => Promise<ChatFile>;
  retryConnection: () => Promise<void>;
}

// IMPORTANT: Export ChatContext directly
export const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  // State for chat data
  const [activeChats, setActiveChats] = useState<ChatFile[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatMetadata | null>(null);
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  
  // State for UI
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean>(true);
  
  // Computed property for current messages
  const currentMessages = currentDate && messages[currentDate] ? messages[currentDate] : [];
  
  // Check API connection on mount
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        // Simple endpoint to check if API is reachable
        await ChatService.checkApiConnection();
        setApiConnected(true);
      } catch (err) {
        console.error('API connection check failed:', err);
        setApiConnected(false);
      }
    };
    
    checkApiConnection();
  }, []);
  
  // Fetch all chats
  const fetchChats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let chats;
      try {
        chats = await ChatService.getAllChats();
        setApiConnected(true);
      } catch (err: any) {
        console.error('Error fetching chats:', err);
        
        // If we get a 404 or network error, use fallback data
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          console.log('Using fallback chat data since backend API is not available');
          chats = generateMockChats();
        } else {
          throw err;
        }
      }
      
      setActiveChats(chats);
    } catch (err: any) {
      console.error('Error fetching chats:', err);
      const errorMsg = err.code === 'ERR_NETWORK' 
        ? 'Network error: Cannot connect to the server'
        : err.response?.status === 404
        ? 'API endpoint not found. Please check your backend configuration.'
        : 'Failed to load chats. Please check your connection or try again later.';
        
      setError(errorMsg);
      setApiConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Select a chat and load its metadata
  const selectChat = useCallback(async (chatId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let result;
      let dateRangesData;
      
      try {
        result = await ChatService.getChatMetadata(chatId);
        setApiConnected(true);
        
        // Also fetch date ranges for this chat
        dateRangesData = await ChatService.getDateRanges(chatId);
      } catch (err: any) {
        console.error('Error selecting chat:', err);
        
        // If we get a 404 or network error, use fallback data
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          console.log('Using fallback chat data since backend API is not available');
          const mockData = generateMockChatData(chatId);
          result = mockData.metadata;
          dateRangesData = mockData.dateRanges;
        } else {
          throw err;
        }
      }
      
      setSelectedChat(result);
      setDateRanges(dateRangesData);
      
      // If we have a last message date, set it as the current date
      if (result && result.last_message_date) {
        setCurrentDate(result.last_message_date);
        // Pre-fetch messages for this date
        await fetchMessagesByDate(result.last_message_date);
      }
      
      return result;
    } catch (err: any) {
      console.error('Error selecting chat:', err);
      setError('Failed to load chat details. Please try again later.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Fetch messages for a specific date
  const fetchMessagesByDate = useCallback(async (date: string) => {
    if (!selectedChat) return [];
    
    try {
      setIsLoading(true);
      setError(null);
      
      let messagesData;
      try {
        messagesData = await ChatService.getMessagesByDate(selectedChat.id, date);
        setApiConnected(true);
      } catch (err: any) {
        console.error('Error fetching messages by date:', err);
        
        // If we get a 404 or network error, use fallback data
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          console.log('Using fallback message data since backend API is not available');
          const mockData = generateMockChatData(selectedChat.id);
          messagesData = mockData.messages[date] || [];
        } else {
          throw err;
        }
      }
      
      // Update messages state with new data
      setMessages(prev => ({ ...prev, [date]: messagesData }));
      setCurrentDate(date);
      
      return messagesData;
    } catch (err: any) {
      console.error('Error fetching messages for date:', date, err);
      setError('Failed to load messages. Please try again later.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [selectedChat]);
  
  // Fetch messages for a date range
  const fetchMessagesForDateRange = useCallback(async (startDate: string, endDate: string) => {
    if (!selectedChat) return [];
    
    try {
      setIsLoading(true);
      setError(null);
      
      let messagesData;
      try {
        messagesData = await ChatService.getMessagesForDateRange(selectedChat.id, startDate, endDate);
        setApiConnected(true);
      } catch (err: any) {
        console.error('Error fetching messages for date range:', err);
        
        // If we get a 404 or network error, use fallback data
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          console.log('Using fallback message data since backend API is not available');
          const mockData = generateMockChatData(selectedChat.id);
          // Flatten messages from all available dates in the mock data
          messagesData = Object.values(mockData.messages).flat();
        } else {
          throw err;
        }
      }
      
      return messagesData;
    } catch (err: any) {
      console.error('Error fetching messages for date range:', err);
      setError('Failed to load messages. Please try again later.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [selectedChat]);
  
  // Search messages
  const searchMessages = useCallback(async (query: string, chatId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const targetChatId = chatId || selectedChat?.id;
      if (!targetChatId) {
        throw new Error('No chat selected for search');
      }
      
      let searchResult;
      try {
        searchResult = await SearchService.searchMessages(targetChatId, query);
        setApiConnected(true);
      } catch (err: any) {
        console.error('Error searching messages:', err);
        
        // If we get a 404 or network error, use fallback data
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          console.log('Using fallback search data since backend API is not available');
          const mockData = generateMockChatData(targetChatId);
          // Create a simple search through mock messages
          const allMessages = Object.values(mockData.messages).flat();
          const matchedMessages = allMessages.filter(msg => 
            msg.text.toLowerCase().includes(query.toLowerCase())
          );
          
          searchResult = {
            query,
            results: matchedMessages,
            total_results: matchedMessages.length,
            total_messages_searched: allMessages.length
          };
        } else {
          throw err;
        }
      }
      
      setSearchResults(searchResult);
      return searchResult;
    } catch (err: any) {
      console.error('Error searching messages:', err);
      setError('Failed to search messages. Please try again later.');
      
      // Return empty search results
      const emptyResult: SearchResult = {
        query,
        results: [],
        total_results: 0,
        total_messages_searched: 0
      };
      
      setSearchResults(emptyResult);
      return emptyResult;
    } finally {
      setIsLoading(false);
    }
  }, [selectedChat]);
  
  // Fetch date ranges for a chat
  const fetchDateRanges = useCallback(async (chatId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let dateRangesData;
      try {
        dateRangesData = await ChatService.getDateRanges(chatId);
        setApiConnected(true);
      } catch (err: any) {
        console.error('Error fetching date ranges:', err);
        
        // If we get a 404 or network error, use fallback data
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          console.log('Using fallback date ranges since backend API is not available');
          const mockData = generateMockChatData(chatId);
          dateRangesData = mockData.dateRanges;
        } else {
          throw err;
        }
      }
      
      setDateRanges(dateRangesData);
      return dateRangesData;
    } catch (err: any) {
      console.error('Error fetching date ranges:', err);
      setError('Failed to load date ranges. Please try again later.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Upload a new chat file
  const uploadChat = useCallback(async (file: File, onProgress?: (progress: number) => void) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await ChatService.uploadChat(file, onProgress);
      
      // Refresh the list of chats
      await fetchChats();
      
      return result;
    } catch (err: any) {
      console.error('Error uploading chat:', err);
      setError('Failed to upload chat. Please try again later.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchChats]);
  
  // Retry connection to API
  const retryConnection = useCallback(async () => {
    try {
      // Check API connection
      await ChatService.checkApiConnection();
      setApiConnected(true);
      setError(null);
      
      // Reload chats
      await fetchChats();
    } catch (err) {
      console.error('Failed to connect to API:', err);
      setApiConnected(false);
      setError('Still unable to connect to the API. Please check your backend server.');
    }
  }, [fetchChats]);
  
  const value = {
    // States
    activeChats,
    selectedChat,
    dateRanges,
    messages,
    currentMessages,
    currentDate,
    searchResults,
    isLoading,
    error,
    apiConnected,
    
    // Actions
    fetchChats,
    selectChat,
    fetchMessagesByDate,
    fetchMessagesForDateRange,
    searchMessages,
    fetchDateRanges,
    uploadChat,
    retryConnection
  };
  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
};

// Hook for using chat in a specific component - with automatic loading of a chat
export const useChatById = (chatId?: string) => {
  const context = useChat();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadChat = async () => {
      if (!chatId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        await context.selectChat(chatId);
      } catch (err: any) {
        console.error('Error in useChatById:', err);
        setError(err.message || 'Failed to load chat');
      } finally {
        setLoading(false);
      }
    };
    
    loadChat();
  }, [chatId, context.selectChat]);
  
  return {
    ...context,
    loading: loading || context.isLoading,
    error: error || context.error
  };
};