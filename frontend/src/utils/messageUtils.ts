import { ChatMessage } from '../types';

/**
 * Utility functions for processing chat messages
 */

// Group messages by date
export function groupMessagesByDate(messages: ChatMessage[]): Record<string, ChatMessage[]> {
  const grouped: Record<string, ChatMessage[]> = {};
  
  messages.forEach(message => {
    // Extract date part (YYYY-MM-DD)
    const date = new Date(message.timestamp).toISOString().split('T')[0];
    
    // Initialize array if needed
    if (!grouped[date]) {
      grouped[date] = [];
    }
    
    // Add message to group
    grouped[date].push(message);
  });
  
  return grouped;
}

// Format a message preview with limited length
export function formatMessagePreview(message: ChatMessage, maxLength: number = 50): string {
  // Handle deleted messages
  if (message.isDeleted) {
    return 'This message was deleted';
  }
  
  // Handle media messages
  if (message.isMedia) {
    return 'Media';
  }
  
  // Truncate text if needed
  let text = message.content;
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }
  
  return text;
}

// Get sentiment emoji based on score
export function getSentimentEmoji(score: number): string {
  if (score >= 0.6) return '😄'; // Very positive
  if (score >= 0.2) return '🙂'; // Positive
  if (score > -0.2) return '😐'; // Neutral
  if (score > -0.6) return '🙁'; // Negative
  return '😞'; // Very negative
}

// Find most common words in messages
export function getMostCommonWords(
  messages: ChatMessage[],
  limit: number = 10,
  minLength: number = 3
): Array<{ word: string; count: number }> {
  // Common words to exclude (stop words)
  const stopWords = new Set([
    'the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out',
    'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'will',
    'would', 'should', 'may', 'might', 'must', 'ought', 'i', 'you', 'he', 'she',
    'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'not', 'no', 'yes',
    'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours',
    'theirs', 'what', 'who', 'when', 'where', 'why', 'how', 'all', 'any', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'but', 'or', 'so',
    'than', 'too', 'very', 'just', 'now', 'also', 'only', 'then', 'there',
    'here', 'from', 'get', 'got', 'getting', 'go', 'going', 'want', 'wanted'
  ]);
  
  // Count words
  const wordCounts: Record<string, number> = {};
  
  messages.forEach(message => {
    // Skip media and deleted messages
    if (message.isMedia || message.isDeleted) return;
    
    // Extract words
    const words = message.content
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/); // Split by whitespace
    
    words.forEach(word => {
      // Skip short words and stop words
      if (word.length < minLength || stopWords.has(word)) return;
      
      // Update count
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });
  
  // Convert to array and sort
  const sortedWords = Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  
  return sortedWords;
}

// Get message distribution by time of day
export function getMessageDistributionByTime(messages: ChatMessage[]): Record<string, number> {
  const hourCounts: Record<string, number> = {};
  
  // Initialize hours
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0');
    hourCounts[`${hour}:00`] = 0;
  }
  
  // Count messages by hour
  messages.forEach(message => {
    const date = new Date(message.timestamp);
    const hour = date.getHours().toString().padStart(2, '0');
    hourCounts[`${hour}:00`] = (hourCounts[`${hour}:00`] || 0) + 1;
  });
  
  return hourCounts;
}

// Find dates with high message activity
export function getHighActivityDays(messages: ChatMessage[], percentile: number = 0.9): string[] {
  // Group messages by date and count
  const messagesByDate = groupMessagesByDate(messages);
  
  // Convert to array of counts
  const countsArray = Object.entries(messagesByDate).map(([date, msgs]) => ({
    date,
    count: msgs.length
  }));
  
  // Return empty array if no messages
  if (countsArray.length === 0) return [];
  
  // Sort by count (ascending)
  countsArray.sort((a, b) => a.count - b.count);
  
  // Calculate threshold for high activity (percentile of counts)
  const thresholdIndex = Math.floor(countsArray.length * percentile);
  const threshold = countsArray[thresholdIndex].count;
  
  // Find dates with message count >= threshold
  const highActivityDates = countsArray
    .filter(item => item.count >= threshold)
    .map(item => item.date);
  
  return highActivityDates;
}