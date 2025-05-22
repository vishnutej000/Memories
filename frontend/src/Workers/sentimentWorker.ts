import { ChatMessage } from '../types';

/**
 * Web Worker for analyzing sentiment in messages
 * This runs in a separate thread to avoid blocking the main UI
 */

self.addEventListener('message', (event) => {
  const { messages, id } = event.data;
  
  try {
    // Process messages (analyze sentiment for each)
    const analyzedMessages = analyzeMessagesSentiment(messages);
    
    // Send result back to main thread
    self.postMessage({
      success: true,
      result: analyzedMessages,
      id
    });
  } catch (error) {
    // Send error to main thread
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error analyzing sentiment',
      id
    });
  }
});

/**
 * Simple sentiment analysis for messages
 * This is a basic implementation - in a real app you'd use a proper NLP library or API
 */
function analyzeMessagesSentiment(messages: ChatMessage[]): ChatMessage[] {
  return messages.map(message => {
    // Skip messages without content, deleted messages, and media
    if (!message.content || message.isDeleted || message.isMedia) {
      return {
        ...message,
        sentimentScore: 0 // Neutral
      };
    }
    
    const content = message.content.toLowerCase();
    let score = 0;
    
    // Positive indicators
    const positiveWords = [
      'happy', 'glad', 'great', 'good', 'excellent', 'wonderful', 'amazing', 'love', 
      'like', 'awesome', 'fantastic', 'thank', 'thanks', 'cool', 'best', 'beautiful',
      'enjoy', 'excited', 'nice', 'perfect', 'fun', 'welcome', 'please', 'congratulations',
      ':)', ':-)', '😊', '😄', '👍', '❤️', '👏', '🙂', '😃', '😁', '🥰', '😍', '🤗'
    ];
    
    // Negative indicators
    const negativeWords = [
      'sad', 'sorry', 'bad', 'disappointed', 'hate', 'dislike', 'terrible', 'awful',
      'horrible', 'worst', 'annoying', 'unfortunately', 'upset', 'angry', 'worried',
      'problem', 'regret', 'issue', 'mistake', 'fail', 'poor', 'wrong', 'unhappy',
      ':(', ':-(', '😢', '😭', '😞', '😔', '😠', '😡', '👎', '😒', '😕', '🙁', '☹️'
    ];
    
    // Count positive and negative indicators
    let positiveCount = 0;
    let negativeCount = 0;
    
    // Check for positive words/emoji
    for (const word of positiveWords) {
      if (content.includes(word)) {
        positiveCount++;
      }
    }
    
    // Check for negative words/emoji
    for (const word of negativeWords) {
      if (content.includes(word)) {
        negativeCount++;
      }
    }
    
    // Special cases: negation words reverse sentiment
    const negationWords = ['not', 'no', 'never', "don't", "doesn't", "didn't", "won't", "wouldn't", "haven't", "hasn't"];
    let negationCount = 0;
    
    for (const word of negationWords) {
      if (content.includes(` ${word} `)) {
        negationCount++;
      }
    }
    
    // Calculate sentiment score (-1 to 1)
    const totalIndicators = positiveCount + negativeCount;
    
    if (totalIndicators > 0) {
      // Calculate base score
      const baseScore = (positiveCount - negativeCount) / totalIndicators;
      
      // Apply negation reversals (odd number of negations flips the sentiment)
      score = negationCount % 2 === 1 ? -baseScore : baseScore;
      
      // Intensity factor: longer messages dilute extreme sentiment
      const messageLength = content.split(/\s+/).length;
      const intensityFactor = 1 - Math.min(0.5, messageLength / 40); // Cap dilution at 50%
      
      // Apply intensity factor
      score *= (0.5 + intensityFactor / 2);
    }
    
    // Ensure score is within bounds
    score = Math.max(-1, Math.min(1, score));
    
    // Apply a very slight positive bias for messages with no clear sentiment
    if (Math.abs(score) < 0.1) {
      score = 0;
    }
    
    return {
      ...message,
      sentimentScore: score
    };
  });
}

export {};