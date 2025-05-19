import apiClient from './client';
import { DiaryEntry } from '../types/dairy.types';

export const DiaryService = {
  /**
   * Get diary entry for a specific date
   */
  getDiaryEntry: async (
    chatId: string, 
    date: string
  ): Promise<DiaryEntry | null> => {
    try {
      return await apiClient.get(`/diary/${chatId}/entry/${date}`);
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Create or update diary entry
   */
  saveDiaryEntry: async (
    chatId: string,
    date: string,
    entry: {
      text: string;
      emotion: string;
      has_audio: boolean;
      audio_duration?: number;
    }
  ): Promise<DiaryEntry> => {
    return apiClient.post(`/diary/${chatId}/entry/${date}`, entry);
  },

  /**
   * Get all diary entries for a chat
   */
  getAllDiaryEntries: async (
    chatId: string
  ): Promise<DiaryEntry[]> => {
    return apiClient.get(`/diary/${chatId}/entries`);
  },

  /**
   * Delete diary entry
   */
  deleteDiaryEntry: async (
    chatId: string,
    date: string
  ): Promise<void> => {
    return apiClient.delete(`/diary/${chatId}/entry/${date}`);
  }
};