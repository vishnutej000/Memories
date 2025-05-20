import { useState, useCallback } from 'react';
import { ChatMessage } from '../../types';

/**
 * Custom hook for sentiment analysis operations
 */
export function useSentimentAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Analyze messages using Web Worker
  const analyzeMessages = useCallback(async (messages: ChatMessage[]): Promise<ChatMessage[]> => {
    // If messages already have sentiment scores, return them
    if (messages.every(msg => typeof msg.sentimentScore === 'number')) {
      return messages;
    }
    
    // Analyze using Web Worker
    return new Promise((resolve, reject) => {
      try {
        setIsAnalyzing(true);
        
        // Create worker
        const worker = new Worker(new URL('../workers/sentimentWorker.ts', import.meta.url), { type: 'module' });
        
        // Generate a unique ID for this request
        const requestId = `req_${Date.now()}`;
        
        // Listen for messages from the worker
        worker.onmessage = (e) => {
          const { success, result, error, id } = e.data;
          
          // Only handle responses for our request
          if (id === requestId) {
            if (success) {
              setIsAnalyzing(false);
              resolve(result);
            } else {
              setIsAnalyzing(false);
              reject(new Error(error || 'Failed to analyze sentiment'));
            }
            
            // Terminate the worker
            worker.terminate();
          }
        };
        
        // Handle worker errors
        worker.onerror = (error) => {
          setIsAnalyzing(false);
          reject(new Error(`Worker error: ${error.message}`));
          worker.terminate();
        };
        
        // Send messages to the worker
        worker.postMessage({
          messages,
          id: requestId
        });
      } catch (error) {
        setIsAnalyzing(false);
        reject(error);
      }
    });
  }, []);
  
  // Generate sentiment data for chart
  const generateSentimentData = useCallback((messages: ChatMessage[]) => {
    // Get messages with sentiment scores
    const messagesWithSentiment = messages.filter(msg => typeof msg.sentimentScore === 'number');
    
    if (messagesWithSentiment.length === 0) {
      return [];
    }
    
    // Group messages by date
    const messagesByDate = new Map<string, ChatMessage[]>();
    
    messagesWithSentiment.forEach(message => {
      const date = new Date(message.timestamp).toISOString().split('T')[0];
      
      if (!messagesByDate.has(date)) {
        messagesByDate.set(date, []);
      }
      
      messagesByDate.get(date)!.push(message);
    });
    
    // Calculate average sentiment for each date
    const sentimentData = Array.from(messagesByDate.entries()).map(([date, messages]) => {
      const total = messages.reduce((sum, msg) => sum + (msg.sentimentScore || 0), 0);
      const average = total / messages.length;
      
      return {
        date,
        average,
        messages: messages.length
      };
    });
    
    // Sort by date
    sentimentData.sort((a, b) => a.date.localeCompare(b.date));
    
    return sentimentData;
  }, []);
  
  return {
    isAnalyzing,
    analyzeMessages,
    generateSentimentData
  };
}