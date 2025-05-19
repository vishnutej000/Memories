import { ApiClient } from './client';
import { DiaryEntry } from '../types/dairy.types';

export class DiaryService {
  static async getDiaryEntries(chatId: string): Promise<DiaryEntry[]> {
    try {
      return await ApiClient.get<DiaryEntry[]>(`/diary/${chatId}/entries`);
    } catch (error) {
      console.error('Error fetching diary entries:', error);
      // Return empty array as fallback
      return [];
    }
  }
  
  static async getDiaryEntry(chatId: string, date: string): Promise<DiaryEntry | null> {
    try {
      return await ApiClient.get<DiaryEntry>(`/diary/${chatId}/entries/${date}`);
    } catch (error) {
      console.error('Error fetching diary entry:', error);
      // Return null as fallback
      return null;
    }
  }
  
  static async saveDiaryEntry(chatId: string, date: string, content: string): Promise<DiaryEntry> {
    try {
      return await ApiClient.post<DiaryEntry>(`/diary/${chatId}/entries`, {
        date,
        content
      });
    } catch (error) {
      console.error('Error saving diary entry:', error);
      
      // Fallback to a local mock entry if API fails
      const now = new Date().toISOString();
      return {
        id: `${chatId}_${date}`,
        chatId,
        date,
        content,
        createdAt: now,
        updatedAt: now
      };
    }
  }
  
  static async saveAudioRecording(chatId: string, date: string, audioBlob: Blob): Promise<DiaryEntry> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('date', date);
      
      return await ApiClient.upload<DiaryEntry>(`/diary/${chatId}/audio`, 
        new File([audioBlob], 'recording.webm', { type: 'audio/webm' }),
        { date }
      );
    } catch (error) {
      console.error('Error saving audio recording:', error);
      
      // Fallback to a local mock entry if API fails
      const now = new Date().toISOString();
      // Create object URL for the blob for local usage
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return {
        id: `${chatId}_${date}`,
        chatId,
        date,
        content: '',
        audioUrl,
        createdAt: now,
        updatedAt: now
      };
    }
  }
  
  static async deleteDiaryEntry(chatId: string, date: string): Promise<void> {
    try {
      await ApiClient.delete<void>(`/diary/${chatId}/entries/${date}`);
    } catch (error) {
      console.error('Error deleting diary entry:', error);
    }
  }
}