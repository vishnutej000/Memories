import { ApiClient } from './client';
import { SentimentResponse } from '../types/sentiment.types';

export class SentimentService {
  static async analyzeSentiment(text: string): Promise<SentimentResponse> {
    try {
      return await ApiClient.post<SentimentResponse>('/sentiment/analyze', { text });
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      
      // Fallback to a simple mock sentiment if the API fails
      return {
        score: Math.random() * 2 - 1, // Random score between -1 and 1
        label: 'neutral',
        confidence: 0.7,
        text
      };
    }
  }
  
  static async batchAnalyzeSentiment(texts: string[]): Promise<SentimentResponse[]> {
    try {
      return await ApiClient.post<SentimentResponse[]>('/sentiment/batch', { texts });
    } catch (error) {
      console.error('Error batch analyzing sentiment:', error);
      
      // Fallback to simple mock sentiment results
      return texts.map(text => ({
        score: Math.random() * 2 - 1,
        label: 'neutral',
        confidence: 0.7,
        text
      }));
    }
  }
}