import apiClient from './client';
import { ChatFile, ChatMetadata, ChatMessage, DateRange } from '../types/chat.types';

export const ChatService = {
  /**
   * Upload and parse WhatsApp chat file
   */
  uploadChatFile: async (
    file: File, 
    userIdentifier: string,
    onProgress?: (progress: number) => void
  ): Promise<ChatMetadata> => {
    return apiClient.uploadFile(file, '/chat/upload', userIdentifier, onProgress);
  },

  /**
   * Get parsed chat messages with pagination
   */
  getMessages: async (
    chatId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<{ messages: ChatMessage[], total: number, metadata: ChatMetadata }> => {
    return apiClient.get(`/chat/${chatId}/messages`, {
      params: { page, limit }
    });
  },

  /**
   * Get messages for a specific date
   */
  getMessagesByDate: async (
    chatId: string, 
    date: string
  ): Promise<ChatMessage[]> => {
    return apiClient.get(`/chat/${chatId}/messages/date/${date}`);
  },

  /**
   * Get date ranges with message counts
   */
  getDateRanges: async (chatId: string): Promise<DateRange[]> => {
    return apiClient.get(`/chat/${chatId}/dates`);
  },

  /**
   * Search for messages
   */
  searchMessages: async (
    chatId: string, 
    query: string,
    page: number = 1, 
    limit: number = 20
  ): Promise<{ messages: ChatMessage[], total: number }> => {
    return apiClient.get(`/chat/${chatId}/search`, {
      params: { query, page, limit }
    });
  },

  /**
   * Get significant events in the chat
   */
  getSignificantEvents: async (chatId: string): Promise<any> => {
    return apiClient.get(`/chat/${chatId}/events`);
  },
  
  /**
   * Get all active chats
   */
  getAllChats: async (): Promise<ChatFile[]> => {
    return apiClient.get('/chat');
  },

  /**
   * Delete a chat
   */
  deleteChat: async (chatId: string): Promise<void> => {
    return apiClient.delete(`/chat/${chatId}`);
  }
};