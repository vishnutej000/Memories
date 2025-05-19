import { format } from 'date-fns';
import { ChatMessage, MessageType } from '../types/chat.types';

/**
 * Parse a WhatsApp message line into a structured message object
 */
export const parseWhatsAppMessage = (
  line: string, 
  chatId: string,
  dateRegex: RegExp = /\[(\d{2}\/\d{2}\/\d{4}), (\d{1,2}:\d{2}:\d{2} [AP]M)\] ([^:]+): (.*)/
): ChatMessage | null => {
  const match = line.match(dateRegex);
  
  if (!match) {
    return null;
  }
  
  const [, dateStr, timeStr, sender, content] = match;
  
  // Parse date parts (assuming MM/DD/YYYY format, which may need adjustment)
  const [month, day, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  // Simple message type detection based on content
  let messageType: MessageType = 'text';
  let mediaUrl: string | undefined = undefined;
  
  if (content.includes('<Media omitted>')) {
    // For media messages, determine type based on content 
    if (content.includes('image')) {
      messageType = 'image';
    } else if (content.includes('video')) {
      messageType = 'video';
    } else if (content.includes('audio')) {
      messageType = 'audio';
    } else if (content.includes('document')) {
      messageType = 'document';
    } else {
      messageType = 'image'; // Default to image if unclear
    }
  }
  
  return {
    id: `${chatId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    chat_id: chatId,
    timestamp: date.toISOString(),
    date: format(date, 'yyyy-MM-dd'),
    time: timeStr,
    sender,
    content,
    type: messageType,
    media_url: mediaUrl,
  };
};

/**
 * Detect date format in a WhatsApp chat export
 */
export const detectDateFormat = (
  lines: string[], 
  sampleSize: number = 10
): RegExp => {
  // Common date format patterns in different regions
  const datePatterns = [
    // MM/DD/YYYY format (US)
    /\[(\d{2}\/\d{2}\/\d{4}), (\d{1,2}:\d{2}(?::\d{2})?(?: [AP]M)?)\]/,
    // DD/MM/YYYY format (UK, Europe)
    /\[(\d{2}\/\d{2}\/\d{4}), (\d{1,2}:\d{2}(?::\d{2})?(?: [AP]M)?)\]/,
    // YYYY/MM/DD format (Asia)
    /\[(\d{4}\/\d{2}\/\d{2}), (\d{1,2}:\d{2}(?::\d{2})?(?: [AP]M)?)\]/,
    // DD.MM.YYYY format (Europe)
    /\[(\d{2}\.\d{2}\.\d{4}), (\d{1,2}:\d{2}(?::\d{2})?(?: [AP]M)?)\]/,
  ];
  
  // Count matches for each pattern
  const matchCounts = datePatterns.map(() => 0);
  
  // Check first few lines
  for (let i = 0; i < Math.min(sampleSize, lines.length); i++) {
    const line = lines[i];
    
    for (let j = 0; j < datePatterns.length; j++) {
      if (datePatterns[j].test(line)) {
        matchCounts[j]++;
      }
    }
  }
  
  // Return the pattern with the most matches
  const maxIndex = matchCounts.indexOf(Math.max(...matchCounts));
  return datePatterns[maxIndex === -1 ? 0 : maxIndex];
};