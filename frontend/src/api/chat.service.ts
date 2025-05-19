import { ApiClient } from './client';
import { API_ENDPOINTS, getUrl } from './config';
import { ChatFile, ChatMetadata, ChatMessage, DateRange } from '../types/chat.types';

export class ChatService {
  static async getAllChats(): Promise<ChatFile[]> {
    return ApiClient.get<ChatFile[]>(API_ENDPOINTS.CHATS);
  }
  
  static async getMessages(chatId: string, page = 1, limit = 50): Promise<{ messages: ChatMessage[], total: number, metadata: ChatMetadata }> {
    const url = getUrl(API_ENDPOINTS.MESSAGES, { chatId });
    return ApiClient.get<{ messages: ChatMessage[], total: number, metadata: ChatMetadata }>(
      url, 
      { params: { page, limit } }
    );
  }
  
  static async getMessagesByDate(chatId: string, date: string): Promise<ChatMessage[]> {
    const url = getUrl(API_ENDPOINTS.MESSAGES_BY_DATE, { chatId, date });
    return ApiClient.get<ChatMessage[]>(url);
  }
  
  static async getDateRanges(chatId: string): Promise<DateRange[]> {
    const url = getUrl(API_ENDPOINTS.DATE_RANGES, { chatId });
    return ApiClient.get<DateRange[]>(url);
  }
  
  static async searchMessages(chatId: string, query: string, page = 1, limit = 20): Promise<{ messages: ChatMessage[], total: number }> {
    const url = getUrl(API_ENDPOINTS.SEARCH_MESSAGES, { chatId });
    return ApiClient.get<{ messages: ChatMessage[], total: number }>(
      url, 
      { params: { query, page, limit } }
    );
  }
  
  static async uploadChatFile(file: File, userIdentifier: string, onProgress?: (progress: number) => void): Promise<ChatMetadata> {
    return ApiClient.upload<ChatMetadata>(
      API_ENDPOINTS.CHAT_UPLOAD,
      file,
      { user_identifier: userIdentifier },
      onProgress
    );
  }
  
  static async deleteChat(chatId: string): Promise<void> {
    const url = getUrl(API_ENDPOINTS.CHAT, { chatId });
    return ApiClient.delete<void>(url);
  }
}