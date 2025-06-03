/**
 * Hybrid storage service that works with both IndexedDB and backend API
 * This service will try to use the backend API first, and fall back to local storage
 */

import { WhatsAppChat, BackendChat } from '../types';
import APIService from './apiService';
import * as localStorage from './storageServices';

/**
 * Converts backend chat format to frontend chat format
 */
function convertBackendChatToFrontend(backendChat: BackendChat): WhatsAppChat {
  return {
    id: backendChat.id,
    name: backendChat.title,
    participants: backendChat.participants,
    messages: [], // Messages will be loaded separately if needed
    isGroup: backendChat.is_group_chat,
    startDate: backendChat.first_message_date,
    endDate: backendChat.last_message_date,
    messageCount: backendChat.message_count,
    metadata: {
      filename: backendChat.filename,
      dateRange: backendChat.date_range
    }
  };
}

/**
 * Converts frontend chat format to backend chat format
 */
function convertFrontendChatToBackend(frontendChat: WhatsAppChat): Partial<BackendChat> {
  return {
    id: frontendChat.id,
    title: frontendChat.name,
    is_group_chat: frontendChat.isGroup,
    filename: frontendChat.metadata?.filename || `${frontendChat.name}.txt`,
    participants: frontendChat.participants,
    message_count: frontendChat.messageCount,
    date_range: {
      start: frontendChat.startDate,
      end: frontendChat.endDate
    },
    first_message_date: frontendChat.startDate,
    last_message_date: frontendChat.endDate
  };
}

/**
 * Hybrid storage service
 */
export class HybridStorageService {
  private static useBackend = true;

  /**
   * Test if backend is available
   */
  static async testBackendConnection(): Promise<boolean> {
    try {
      const isConnected = await APIService.testConnection();
      this.useBackend = isConnected;
      return isConnected;
    } catch (error) {
      console.warn('Backend not available, using local storage:', error);
      this.useBackend = false;
      return false;
    }
  }

  /**
   * Get all chats
   */
  static async getAllChats(): Promise<WhatsAppChat[]> {
    // Test backend connection first
    await this.testBackendConnection();

    if (this.useBackend) {
      try {
        const backendChats = await APIService.getChats();
        return backendChats.map(convertBackendChatToFrontend);
      } catch (error) {
        console.warn('Failed to fetch from backend, falling back to local storage:', error);
        this.useBackend = false;
      }
    }

    // Fall back to local storage
    return localStorage.getAllChats();
  }

  /**
   * Get a specific chat
   */
  static async getChat(chatId: string): Promise<WhatsAppChat> {
    if (this.useBackend) {
      try {
        const backendChat = await APIService.getChat(chatId);
        return convertBackendChatToFrontend(backendChat);
      } catch (error) {
        console.warn(`Failed to fetch chat ${chatId} from backend, falling back to local storage:`, error);
        this.useBackend = false;
      }
    }

    // Fall back to local storage
    return localStorage.getChat(chatId);
  }

  /**
   * Save a chat
   */
  static async saveChat(chat: WhatsAppChat): Promise<string> {
    let chatId = chat.id;

    // Save to local storage first (always as backup)
    chatId = await localStorage.saveChat(chat);

    // Try to save to backend
    if (this.useBackend) {
      try {
        const backendChatData = convertFrontendChatToBackend(chat);
        await APIService.createChat(backendChatData);
      } catch (error) {
        console.warn('Failed to save chat to backend, saved locally only:', error);
      }
    }

    return chatId;
  }

  /**
   * Delete a chat
   */
  static async deleteChat(chatId: string): Promise<void> {
    // Delete from local storage
    await localStorage.deleteChat(chatId);

    // Note: Backend doesn't have delete endpoint yet, but we'll handle it gracefully
    if (this.useBackend) {
      try {
        // If backend adds delete endpoint, we can call it here
        console.log(`Chat ${chatId} deleted locally (backend delete not implemented)`);
      } catch (error) {
        console.warn('Failed to delete chat from backend:', error);
      }
    }
  }

  /**
   * Check if any data exists
   */
  static async hasAnyData(): Promise<boolean> {
    if (this.useBackend) {
      try {
        const chats = await APIService.getChats();
        return chats.length > 0;
      } catch (error) {
        console.warn('Failed to check backend data, checking local storage:', error);
        this.useBackend = false;
      }
    }

    // Fall back to local storage
    return localStorage.hasAnyData();
  }

  /**
   * Get chat statistics (backend only feature)
   */
  static async getChatStatistics(chatId: string) {
    if (this.useBackend) {
      try {
        return await APIService.getChatStatistics(chatId);
      } catch (error) {
        console.warn('Failed to get chat statistics from backend:', error);
        throw new Error('Chat statistics are only available when connected to the backend');
      }
    }
    
    throw new Error('Backend connection required for chat statistics');
  }

  /**
   * Get chat keywords (backend only feature)
   */
  static async getChatKeywords(chatId: string, topN: number = 10) {
    if (this.useBackend) {
      try {
        return await APIService.getChatKeywords(chatId, topN);
      } catch (error) {
        console.warn('Failed to get chat keywords from backend:', error);
        throw new Error('Chat keywords are only available when connected to the backend');
      }
    }
    
    throw new Error('Backend connection required for chat keywords');
  }

  /**
   * Export chat (backend only feature)
   */
  static async exportChat(chatId: string, format: string = 'pdf') {
    if (this.useBackend) {
      try {
        return await APIService.exportChat(chatId, format);
      } catch (error) {
        console.warn('Failed to export chat from backend:', error);
        throw new Error('Chat export is only available when connected to the backend');
      }
    }
    
    throw new Error('Backend connection required for chat export');
  }

  /**
   * Audio functions
   */  static async uploadAudio(file: File): Promise<{ filename: string; size: number; status: string }> {
    if (this.useBackend) {
      try {
        const formData = new FormData();
        formData.append('file', file);        const response = await APIService.uploadAudio(formData) as {
          filename: string;
          size: number;
          status: string;
          content_type: string;
          upload_time: string;
        };
        
        return {
          filename: response.filename,
          size: response.size,
          status: response.status
        };
      } catch (error) {
        console.error('Backend audio upload failed:', error);
        // Fall back to local storage
      }
    }

    // Local storage fallback - use whatsappServices uploadAudioNote
    const blob = new Blob([file], { type: file.type });
    const chatId = 'default'; // Extract from filename if needed
    const date = new Date().toISOString().split('T')[0];
    const { uploadAudioNote } = await import('./whatsappServices');
    await uploadAudioNote(chatId, date, blob);
    
    return {
      filename: file.name,
      size: file.size,
      status: 'success'
    };
  }

  /**
   * Get backend connection status
   */
  static isBackendConnected(): boolean {
    return this.useBackend;
  }

  /**
   * Force check backend connection
   */
  static async checkBackendConnection(): Promise<boolean> {
    return this.testBackendConnection();
  }
}

// Export both services for flexibility
export { HybridStorageService as default };
export * from './storageServices'; // Re-export local storage functions
