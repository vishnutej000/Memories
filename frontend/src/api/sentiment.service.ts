import apiClient from './client';
import { SentimentAnalysis, DailySentiment, EmojiAnalysis } from '../types/sentiment.types';

export const SentimentService = {
  /**
   * Get sentiment analysis for entire chat
   */
  getChatSentiment: async (chatId: string): Promise<SentimentAnalysis> => {
    return apiClient.getWithWorker(`/sentiment/${chatId}`);
  },

  /**
   * Get sentiment for a specific date range
   */
  getSentimentByDateRange: async (
    chatId: string, 
    startDate: string, 
    endDate: string
  ): Promise<DailySentiment[]> => {
    return apiClient.get(`/sentiment/${chatId}/range`, {
      params: { start_date: startDate, end_date: endDate }
    });
  },

  /**
   * Get sentiment for a specific sender
   */
  getSentimentBySender: async (
    chatId: string, 
    sender: string
  ): Promise<SentimentAnalysis> => {
    return apiClient.get(`/sentiment/${chatId}/sender/${encodeURIComponent(sender)}`);
  },

  /**
   * Get emoji analysis
   */
  getEmojiAnalysis: async (chatId: string): Promise<EmojiAnalysis> => {
    return apiClient.get(`/sentiment/${chatId}/emoji`);
  },

  /**
   * Get phrase analysis
   */
  getPhraseAnalysis: async (chatId: string): Promise<any> => {
    return apiClient.get(`/sentiment/${chatId}/phrases`);
  }
};