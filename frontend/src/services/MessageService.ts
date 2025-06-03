import { ChatMessage, SearchCriteria, SearchResultWithContext } from '../types';
import HybridStorageService from './hybridStorageService';

/**
 * Service for message-related operations
 */
class MessageService {
  /**
   * Search messages in a chat based on search criteria
   * @param criteria The search criteria
   * @returns Array of messages matching the criteria
   */  public async searchMessages(criteria: SearchCriteria): Promise<ChatMessage[]> {
    try {
      // Get the chat using hybrid storage service
      const chat = await HybridStorageService.getChat(criteria.chatId);
      
      // Filter messages based on search criteria
      let results = [...chat.messages];
      
      // Filter by query text
      if (criteria.query) {
        const query = criteria.query.toLowerCase();
        results = results.filter(message => 
          message.content.toLowerCase().includes(query)
        );
      }
      
      // Filter by sender
      if (criteria.sender) {
        results = results.filter(message => 
          message.sender === criteria.sender
        );
      }
      
      // Filter by date range
      if (criteria.dateRange) {
        const startDate = new Date(criteria.dateRange.start);
        const endDate = new Date(criteria.dateRange.end);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        results = results.filter(message => {
          const messageDate = new Date(message.timestamp);
          return messageDate >= startDate && messageDate <= endDate;
        });
      }
      
      // Filter by media
      if (criteria.hasMedia !== undefined) {
        results = results.filter(message => 
          message.isMedia === criteria.hasMedia
        );
      }
      
      // Filter by emoji
      if (criteria.hasEmoji !== undefined) {
        results = results.filter(message => 
          criteria.hasEmoji ? (message.emojiCount || 0) > 0 : (message.emojiCount || 0) === 0
        );
      }
      
      // Filter by sentiment
      if (criteria.sentimentRange) {
        results = results.filter(message => {
          if (message.sentimentScore === undefined) return false;
          
          const { min = -1, max = 1 } = criteria.sentimentRange || {};
          return message.sentimentScore >= min && message.sentimentScore <= max;
        });
      }
      
      // Sort by timestamp (newest first)
      results.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      return results;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  /**
   * Search messages with context (messages before and after)
   * @param criteria The search criteria
   * @param contextSize Number of messages to include before and after matches
   * @returns Array of search results with context
   */
  public async searchMessagesWithContext(
    criteria: SearchCriteria, 
    contextSize: number = 2
  ): Promise<SearchResultWithContext[]> {    try {
      // Get the chat
      const chat = await HybridStorageService.getChat(criteria.chatId);
      const allMessages = chat.messages;
      
      // Find matching messages
      const matchingMessages = await this.searchMessages(criteria);
      
      // Add context to each matching message
      return matchingMessages.map(message => {
        // Find index of current message in all messages
        const messageIndex = allMessages.findIndex(m => m.id === message.id);
        
        if (messageIndex === -1) {
          return { message };
        }
        
        // Get context messages
        const before = allMessages
          .slice(Math.max(0, messageIndex - contextSize), messageIndex);
        
        const after = allMessages
          .slice(messageIndex + 1, Math.min(allMessages.length, messageIndex + contextSize + 1));
        
        // Find match indexes if there was a text query
        let matchIndexes: number[] | undefined;
        
        if (criteria.query) {
          const query = criteria.query.toLowerCase();
          const content = message.content.toLowerCase();
          
          // Find all occurrences of the query in the content
          const matches: number[] = [];
          let index = content.indexOf(query);
          
          while (index !== -1) {
            matches.push(index);
            index = content.indexOf(query, index + 1);
          }
          
          if (matches.length > 0) {
            matchIndexes = matches;
          }
        }
        
        return {
          message,
          context: {
            before,
            after
          },
          matchIndexes
        };
      });
    } catch (error) {
      console.error('Error searching messages with context:', error);
      throw error;
    }
  }
  
  /**
   * Find frequently occurring phrases in chat messages
   * @param chatId Chat ID
   * @param minLength Minimum phrase length
   * @param maxLength Maximum phrase length
   * @param limit Maximum number of phrases to return
   * @returns Array of phrases with counts
   */
  public async findFrequentPhrases(
    chatId: string,
    minLength: number = 3,
    maxLength: number = 5,
    limit: number = 10
  ): Promise<Array<{ phrase: string; count: number }>> {    try {
      // Get chat messages
      const chat = await HybridStorageService.getChat(chatId);
      const messages = chat.messages.filter(m => !m.isDeleted && !m.isMedia);
      
      // Extract phrases of different lengths
      const phraseCounts: Record<string, number> = {};
      
      messages.forEach(message => {
        const words = message.content
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length >= 2);
        
        // Skip messages with too few words
        if (words.length < minLength) return;
        
        // Generate phrases of different lengths
        for (let length = minLength; length <= Math.min(maxLength, words.length); length++) {
          for (let i = 0; i <= words.length - length; i++) {
            const phrase = words.slice(i, i + length).join(' ');
            phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
          }
        }
      });
      
      // Convert to array and sort
      const phrases = Object.entries(phraseCounts)
        .map(([phrase, count]) => ({ phrase, count }))
        .filter(item => item.count > 1) // Only include phrases used more than once
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
      
      return phrases;
    } catch (error) {
      console.error('Error finding frequent phrases:', error);
      throw error;
    }
  }
  
  /**
   * Get statistics about a user's messaging behavior
   * @param chatId Chat ID
   * @param sender Sender name
   * @returns Statistics about user's messages
   */
  public async getUserMessageStats(
    chatId: string,
    sender: string
  ): Promise<{
    totalMessages: number;
    averageLength: number;
    responseTime: number;
    activeHours: Record<number, number>;
    topWords: Array<{ word: string; count: number }>;
  }> {    try {
      // Get chat
      const chat = await HybridStorageService.getChat(chatId);
      
      // Filter messages by sender
      const userMessages = chat.messages.filter(m => m.sender === sender);
      
      // Calculate total messages
      const totalMessages = userMessages.length;
      
      // Calculate average message length
      const totalLength = userMessages.reduce((acc, msg) => {
        if (!msg.isDeleted && !msg.isMedia) {
          return acc + msg.content.length;
        }
        return acc;
      }, 0);
      
      const averageLength = totalMessages > 0 
        ? Math.round(totalLength / totalMessages) 
        : 0;
      
      // Calculate average response time
      let totalResponseTime = 0;
      let responseCount = 0;
      
      for (let i = 1; i < chat.messages.length; i++) {
        const prevMsg = chat.messages[i - 1];
        const currMsg = chat.messages[i];
        
        // If current message is from the user and previous is not
        if (currMsg.sender === sender && prevMsg.sender !== sender) {
          const prevTime = new Date(prevMsg.timestamp).getTime();
          const currTime = new Date(currMsg.timestamp).getTime();
          const diff = currTime - prevTime;
          
          // Only count responses that happen within 2 hours
          if (diff > 0 && diff < 2 * 60 * 60 * 1000) {
            totalResponseTime += diff;
            responseCount++;
          }
        }
      }
      
      const responseTime = responseCount > 0 
        ? Math.round(totalResponseTime / responseCount / 1000) // in seconds
        : 0;
      
      // Calculate active hours
      const activeHours: Record<number, number> = {};
      
      // Initialize all hours
      for (let i = 0; i < 24; i++) {
        activeHours[i] = 0;
      }
      
      // Count messages by hour
      userMessages.forEach(msg => {
        const hour = new Date(msg.timestamp).getHours();
        activeHours[hour] = (activeHours[hour] || 0) + 1;
      });
      
      // Find top words
      const wordCounts: Record<string, number> = {};
      const stopWords = new Set([
        'the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
        'is', 'are', 'was', 'were', 'be', 'you', 'i', 'he', 'she', 'it', 'we', 'they'
      ]);
      
      userMessages.forEach(msg => {
        if (!msg.isDeleted && !msg.isMedia) {
          const words = msg.content
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/);
          
          words.forEach(word => {
            if (word.length > 2 && !stopWords.has(word)) {
              wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
          });
        }
      });
      
      const topWords = Object.entries(wordCounts)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
      
      return {
        totalMessages,
        averageLength,
        responseTime,
        activeHours,
        topWords
      };
    } catch (error) {
      console.error('Error getting user message stats:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const messageService = new MessageService();