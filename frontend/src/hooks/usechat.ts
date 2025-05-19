import { useState, useEffect, useCallback, useRef } from 'react';
import { useIndexedDB } from './useIndexedDB';
import { ChatService } from '../api/chat.service';
import { ChatMessage, ChatMetadata, DateRange } from '../types/chat.types';

export const useChat = (chatId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [metadata, setMetadata] = useState<ChatMetadata | null>(null);
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  const messageCache = useRef<Map<string, ChatMessage[]>>(new Map());
  const db = useIndexedDB();

  // Load chat data if chatId is provided
  useEffect(() => {
    if (!chatId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        // Try to get metadata from IndexedDB first
        const cachedMetadata = await db.get<ChatMetadata>('chat_metadata', chatId);
        
        if (cachedMetadata) {
          setMetadata(cachedMetadata);
          
          // Fetch date ranges
          await fetchDateRanges();
          
          // Check if today's messages are cached
          const today = new Date().toISOString().split('T')[0];
          const cachedMessages = await db.getAllFromIndex<ChatMessage>(
            'messages', 
            'by_date', 
            [chatId, today]
          );
          
          if (cachedMessages && cachedMessages.length > 0) {
            setMessages(cachedMessages);
          } else {
            // If not cached, fetch from API
            await fetchMessages(1, 50);
          }
        } else {
          // If metadata not in cache, fetch from API
          const result = await ChatService.getMessages(chatId, 1, 1);
          setMetadata(result.metadata);
          
          // Cache metadata
          await db.put('chat_metadata', result.metadata);
          
          // Fetch messages and date ranges
          await fetchMessages(1, 50);
          await fetchDateRanges();
        }
      } catch (err: any) {
        console.error('Error loading chat:', err);
        setError(err.message || 'Failed to load chat data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [chatId]);
  
  const fetchMessages = useCallback(async (page = 1, limit = 50) => {
    if (!chatId) return { messages: [], total: 0 };
    
    try {
      setLoading(true);
      const result = await ChatService.getMessages(chatId, page, limit);
      
      // Add to existing messages if not page 1
      if (page === 1) {
        setMessages(result.messages);
      } else {
        setMessages(prev => [...prev, ...result.messages]);
      }
      
      // Cache messages in IndexedDB
      for (const msg of result.messages) {
        await db.put('messages', msg);
      }
      
      return result;
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to load messages');
      return { messages: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [chatId, db]);

  const fetchMessagesByDate = useCallback(async (date: string) => {
    if (!chatId) return [];
    
    try {
      setLoading(true);
      
      // Check cache first
      const cacheKey = `${chatId}_${date}`;
      if (messageCache.current.has(cacheKey)) {
        const cachedMessages = messageCache.current.get(cacheKey)!;
        setMessages(cachedMessages);
        return cachedMessages;
      }
      
      // Then check IndexedDB
      const cachedMessages = await db.getAllFromIndex<ChatMessage>(
        'messages', 
        'by_date', 
        [chatId, date]
      );
      
      if (cachedMessages && cachedMessages.length > 0) {
        setMessages(cachedMessages);
        messageCache.current.set(cacheKey, cachedMessages);
        return cachedMessages;
      }
      
      // Finally fetch from API
      const messagesForDate = await ChatService.getMessagesByDate(chatId, date);
      setMessages(messagesForDate);
      
      // Cache messages
      messageCache.current.set(cacheKey, messagesForDate);
      for (const msg of messagesForDate) {
        await db.put('messages', msg);
      }
      
      return messagesForDate;
    } catch (err: any) {
      console.error('Error fetching messages by date:', err);
      setError(err.message || 'Failed to load messages for this date');
      return [];
    } finally {
      setLoading(false);
    }
  }, [chatId, db]);

  const fetchDateRanges = useCallback(async () => {
    if (!chatId) return [];
    
    try {
      // Check IndexedDB first
      const cachedRanges = await db.get<{chatId: string, ranges: DateRange[]}>('date_ranges', chatId);
      
      if (cachedRanges) {
        setDateRanges(cachedRanges.ranges);
        return cachedRanges.ranges;
      }
      
      // Fetch from API if not cached
      const ranges = await ChatService.getDateRanges(chatId);
      setDateRanges(ranges);
      
      // Cache in IndexedDB
      await db.put('date_ranges', { chatId, ranges });
      
      return ranges;
    } catch (err: any) {
      console.error('Error fetching date ranges:', err);
      setError(err.message || 'Failed to load chat timeline');
      return [];
    }
  }, [chatId, db]);

  const uploadChat = useCallback(async (file: File, userIdentifier: string) => {
    try {
      setLoading(true);
      setUploadProgress(0);
      setError(null);
      
      const result = await ChatService.uploadChatFile(
        file, 
        userIdentifier,
        progress => setUploadProgress(progress)
      );
      
      // Cache metadata
      await db.put('chat_metadata', result);
      
      return result;
    } catch (err: any) {
      console.error('Error uploading chat:', err);
      setError(err.message || 'Failed to upload and process chat file');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [db]);

  const searchMessages = useCallback(async (query: string, page = 1, limit = 20) => {
    if (!chatId || !query.trim()) return { messages: [], total: 0 };
    
    try {
      setLoading(true);
      return await ChatService.searchMessages(chatId, query, page, limit);
    } catch (err: any) {
      console.error('Error searching messages:', err);
      setError(err.message || 'Search failed');
      return { messages: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  return {
    messages,
    metadata,
    dateRanges,
    loading,
    error,
    uploadProgress,
    fetchMessages,
    fetchMessagesByDate,
    fetchDateRanges,
    uploadChat,
    searchMessages,
  };
};