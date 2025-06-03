/**
 * API Service for communicating with the backend
 * Aligns with the backend API structure in main.py
 */

import { api } from '../api/fetchWrapper';

// Types based on backend API responses
export interface BackendChat {
  id: string;
  title: string;
  is_group_chat: boolean;
  filename: string;
  participants: string[];
  message_count: number;
  date_range: {
    start: string;
    end: string;
  };
  first_message_date: string;
  last_message_date: string;
}

export interface BackendMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
}

export interface BackendChatStatistics {
  total_messages: number;
  date_range: { [key: string]: string };
  message_count_by_user: Array<{
    user: string;
    count: number;
    percentage: number;
  }>;
  message_count_by_day: Array<{
    day: string;
    count: number;
  }>;
  message_count_by_hour: Array<{
    hour: number;
    count: number;
  }>;
  average_messages_per_day: number;
  busiest_day: string;
  quietest_day: string;
  busiest_hour: number;
}

export interface BackendKeywords {
  keywords: Array<{
    word: string;
    count: number;
    sentiment?: number;
  }>;
  count: number;
}

export interface BackendExportOptions {
  formats: string[];
  message: string;
}

export interface BackendExportResult {
  status: string;
  message: string;
  download_url: string;
}

export interface BackendAudioRecording {
  id: string;
  filename: string;
  duration: number;
  uploaded_at: string;
  transcribed: boolean;
}

export interface BackendUploadResult {
  filename: string;
  size: number;
  content_type: string;
  upload_time: string;
  status: string;
}

export interface BackendTranscriptionResult {
  recording_id: string;
  status: string;
  estimated_completion_time: string;
  message: string;
}

export interface HealthCheckResponse {
  status: string;
  version: string;
  timestamp: number;
}

/**
 * API Service class
 */
export class APIService {
    /**
   * Health check endpoint (absolute path since it's not under /api/v1)
   */
  static async healthCheck(): Promise<HealthCheckResponse> {
    try {
      // Health check is at /health, not /api/v1/health
      const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';
      return await fetch(`${baseUrl}/health`).then(res => res.json());
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Get all chats
   */
  static async getChats(): Promise<BackendChat[]> {
    try {
      return await api.get<BackendChat[]>('/chats');
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      throw error;
    }
  }

  /**
   * Get a specific chat by ID
   */
  static async getChat(chatId: string): Promise<BackendChat> {
    try {
      return await api.get<BackendChat>(`/chats/${chatId}`);
    } catch (error) {
      console.error(`Failed to fetch chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new chat
   */
  static async createChat(chatData: Partial<BackendChat>): Promise<BackendChat> {
    try {
      return await api.post<BackendChat>('/chats', chatData);
    } catch (error) {
      console.error('Failed to create chat:', error);
      throw error;
    }
  }

  /**
   * Get chat statistics
   */
  static async getChatStatistics(chatId: string): Promise<BackendChatStatistics> {
    try {
      return await api.get<BackendChatStatistics>(`/chats/${chatId}/statistics`);
    } catch (error) {
      console.error(`Failed to fetch statistics for chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Get chat keywords
   */
  static async getChatKeywords(chatId: string, topN: number = 10): Promise<BackendKeywords> {
    try {
      return await api.get<BackendKeywords>(`/chats/${chatId}/keywords`, {
        params: { top_n: topN }
      });
    } catch (error) {
      console.error(`Failed to fetch keywords for chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Get export options
   */
  static async getExportOptions(): Promise<BackendExportOptions> {
    try {
      return await api.get<BackendExportOptions>('/export');
    } catch (error) {
      console.error('Failed to fetch export options:', error);
      throw error;
    }
  }

  /**
   * Export a chat
   */
  static async exportChat(chatId: string, format: string = 'pdf'): Promise<BackendExportResult> {
    try {
      return await api.post<BackendExportResult>(`/export/chat/${chatId}`, { format });
    } catch (error) {
      console.error(`Failed to export chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Get export history
   */
  static async getExportHistory(): Promise<{ exports: Array<{ id: string; date: string; format: string; }> }> {
    try {
      return await api.get('/export/history');
    } catch (error) {
      console.error('Failed to fetch export history:', error);
      throw error;
    }
  }
  /**
   * Upload an audio file
   */
  static async uploadAudio(formData: FormData) {
    try {
      return await api.post('/audio/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('Failed to upload audio:', error);
      throw error;
    }
  }
  /**
   * Detect participants from WhatsApp file without full parsing
   */
  static async detectParticipants(file: File): Promise<string[]> {
    try {
      // Try backend detection first
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.upload('/chats/detect-participants', formData);
      return (response as any).participants || [];
    } catch (error) {
      console.error('Backend participant detection failed, using local fallback:', error);
      
      // Fallback to local detection
      try {
        const text = await file.text();
        const participants = new Set<string>();
        
        // Common WhatsApp message patterns
        const patterns = [
          /\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}\s*(?:AM|PM)?\s*[-–—]\s*([^:]+):/gi,
          /\[\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?\]\s*([^:]+):/gi,
          /\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2}\s*[-–—]\s*([^:]+):/gi
        ];
        
        for (const pattern of patterns) {
          const matches = text.matchAll(pattern);
          for (const match of matches) {
            if (match[1]) {
              const participant = match[1].trim();
              if (participant && participant.length > 0) {
                participants.add(participant);
              }
            }
          }
        }
        
        return Array.from(participants).filter(p => p.length > 0);
      } catch (localError) {
        console.error('Local participant detection failed:', localError);
        throw new Error('Unable to detect participants from file');
      }
    }
  }

  /**
   * Upload WhatsApp chat file
   */
  static async uploadWhatsAppFile(file: File, userName: string): Promise<{
    success: boolean;
    filename: string;
    count: number;
    messages: BackendMessage[];
    participants: string[];
    date_range: {
      start: string;
      end: string;
    };
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_name', userName);

      return await api.upload('/chats/import', formData);
    } catch (error) {
      console.error('Failed to upload WhatsApp file:', error);
      throw error;
    }
  }

  /**
   * Get audio recordings
   */
  static async getAudioRecordings(): Promise<BackendAudioRecording[]> {
    try {
      return await api.get<BackendAudioRecording[]>('/audio/recordings');
    } catch (error) {
      console.error('Failed to fetch audio recordings:', error);
      throw error;
    }
  }

  /**
   * Transcribe an audio recording
   */
  static async transcribeAudio(recordingId: string): Promise<BackendTranscriptionResult> {
    try {
      return await api.get<BackendTranscriptionResult>(`/audio/transcribe/${recordingId}`);
    } catch (error) {
      console.error(`Failed to transcribe audio ${recordingId}:`, error);
      throw error;
    }
  }

  /**
   * Test API connectivity
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await this.healthCheck();
      return response.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}

export default APIService;
