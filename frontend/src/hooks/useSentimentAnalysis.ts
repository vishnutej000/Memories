import { useState, useCallback } from 'react';
import { ChatMessage } from '../types';

/**
 * Custom hook for sentiment analysis of WhatsApp messages
 */
export function useSentimentAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  /**
   * Analyze sentiment of messages using a web worker
   */
  const analyzeMessages = useCallback(async (messages: ChatMessage[]): Promise<ChatMessage[]> => {
    return new Promise((resolve, reject) => {
      try {
        setIsAnalyzing(true);
        
        // Create worker
        const worker = new Worker(new URL('../workers/sentimentWorker.ts', import.meta.url), { type: 'module' });
        
        // Generate a unique ID for this request
        const requestId = `analysis_${Date.now()}`;
        
        // Set up message handler
        worker.onmessage = (e) => {
          const { success, result, error, id } = e.data;
          
          // Check if this is our response
          if (id === requestId) {
            // Terminate worker
            worker.terminate();
            
            // Update state
            setIsAnalyzing(false);
            
            if (success) {
              resolve(result);
            } else {
              reject(new Error(error || 'Error analyzing sentiment'));
            }
          }
        };
        
        // Set up error handler
        worker.onerror = (error) => {
          worker.terminate();
          setIsAnalyzing(false);
          reject(new Error(`Worker error: ${error.message}`));
        };
        
        // Send messages to worker
        worker.postMessage({
          messages,
          id: requestId
        });
      } catch (err) {
        setIsAnalyzing(false);
        reject(err);
      }
    });
  }, []);
  
  /**
   * Generate sentiment data for time series display
   */
  const generateSentimentData = useCallback((messages: ChatMessage[]): Array<{
    date: string;
    average: number;
    messages: number;
  }> => {
    // Group by date
    const dateMap: Record<string, { sum: number; count: number }> = {};
    
    // Process messages
    messages.forEach(message => {
      if (typeof message.sentimentScore !== 'number') return;
      
      // Get date (YYYY-MM-DD)
      const date = new Date(message.timestamp).toISOString().split('T')[0];
      
      // Initialize or update date data
      if (!dateMap[date]) {
        dateMap[date] = { sum: 0, count: 0 };
      }
      
      dateMap[date].sum += message.sentimentScore;
      dateMap[date].count += 1;
    });
    
    // Convert to array and calculate averages
    const result = Object.entries(dateMap).map(([date, { sum, count }]) => ({
      date,
      average: count > 0 ? sum / count : 0,
      messages: count
    }));
    
    // Sort by date
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, []);
  
  return {
    isAnalyzing,
    analyzeMessages,
    generateSentimentData
  };
}