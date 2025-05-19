import { useState, useEffect, useCallback } from 'react';
import { SentimentService } from '../api/sentiment.service';
import { SentimentAnalysis, DailySentiment, EmojiAnalysis } from '../types/sentiment.types';
import { useIndexedDB } from './useIndexedDB';

export const useSentiment = (chatId: string) => {
  const [overallSentiment, setOverallSentiment] = useState<SentimentAnalysis | null>(null);
  const [dailySentiment, setDailySentiment] = useState<DailySentiment[]>([]);
  const [emojiAnalysis, setEmojiAnalysis] = useState<EmojiAnalysis | null>(null);
  const [phraseAnalysis, setPhraseAnalysis] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const db = useIndexedDB();
  
  // Load overall sentiment
  const fetchOverallSentiment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get from IndexedDB first
      const cachedSentiment = await db.get<SentimentAnalysis>(
        'sentiment_data', 
        `${chatId}_overall`
      );
      
      if (cachedSentiment) {
        setOverallSentiment(cachedSentiment);
      } else {
        // If not cached, get from API
        const sentiment = await SentimentService.getChatSentiment(chatId);
        setOverallSentiment(sentiment);
        
        // Cache in IndexedDB
        await db.put('sentiment_data', {
          ...sentiment,
          id: `${chatId}_overall`
        });
      }
    } catch (err: any) {
      console.error('Error fetching sentiment analysis:', err);
      setError(err.message || 'Failed to load sentiment analysis');
    } finally {
      setLoading(false);
    }
  }, [chatId, db]);
  
  // Load sentiment for date range
  const fetchSentimentByDateRange = useCallback(async (
    startDate: string, 
    endDate: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get from IndexedDB first
      const cacheKey = `${chatId}_range_${startDate}_${endDate}`;
      const cachedSentiment = await db.get<{data: DailySentiment[]}>(
        'sentiment_range', 
        cacheKey
      );
      
      if (cachedSentiment) {
        setDailySentiment(cachedSentiment.data);
        return cachedSentiment.data;
      } else {
        // If not cached, get from API
        const sentiment = await SentimentService.getSentimentByDateRange(
          chatId, 
          startDate, 
          endDate
        );
        
        setDailySentiment(sentiment);
        
        // Cache in IndexedDB
        await db.put('sentiment_range', {
          id: cacheKey,
          data: sentiment
        });
        
        return sentiment;
      }
    } catch (err: any) {
      console.error('Error fetching sentiment by date range:', err);
      setError(err.message || 'Failed to load sentiment for date range');
      return [];
    } finally {
      setLoading(false);
    }
  }, [chatId, db]);
  
  // Load emoji analysis
  const fetchEmojiAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get from IndexedDB first
      const cachedAnalysis = await db.get<EmojiAnalysis>(
        'emoji_analysis', 
        chatId
      );
      
      if (cachedAnalysis) {
        setEmojiAnalysis(cachedAnalysis);
      } else {
        // If not cached, get from API
        const analysis = await SentimentService.getEmojiAnalysis(chatId);
        setEmojiAnalysis(analysis);
        
        // Cache in IndexedDB
        await db.put('emoji_analysis', {
          ...analysis,
          id: chatId
        });
      }
    } catch (err: any) {
      console.error('Error fetching emoji analysis:', err);
      setError(err.message || 'Failed to load emoji analysis');
    } finally {
      setLoading(false);
    }
  }, [chatId, db]);
  
  // Load phrase analysis
  const fetchPhraseAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get from IndexedDB first
      const cachedAnalysis = await db.get<any>(
        'phrase_analysis', 
        chatId
      );
      
      if (cachedAnalysis) {
        setPhraseAnalysis(cachedAnalysis);
      } else {
        // If not cached, get from API
        const analysis = await SentimentService.getPhraseAnalysis(chatId);
        setPhraseAnalysis(analysis);
        
        // Cache in IndexedDB
        await db.put('phrase_analysis', {
          ...analysis,
          id: chatId
        });
      }
    } catch (err: any) {
      console.error('Error fetching phrase analysis:', err);
      setError(err.message || 'Failed to load phrase analysis');
    } finally {
      setLoading(false);
    }
  }, [chatId, db]);
  
  return {
    overallSentiment,
    dailySentiment,
    emojiAnalysis,
    phraseAnalysis,
    loading,
    error,
    fetchOverallSentiment,
    fetchSentimentByDateRange,
    fetchEmojiAnalysis,
    fetchPhraseAnalysis
  };
};