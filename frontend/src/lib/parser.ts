export interface Message {
  id: string;
  timestamp: string;
  sender: string;
  content: string;
  type: 'text' | 'media' | 'audio' | 'deleted' | 'system';
  mediaUrl?: string;
}

// Parse WhatsApp chat export file into structured message objects
export const parseWhatsAppChat = async (text: string): Promise<Message[]> => {
  // This regex matches WhatsApp message format with different date patterns
  // It handles both 12-hour and 24-hour time formats and various date formats
  const messageRegex = /^\[?(\d{1,2}[\/.-]\d{1,2}[\/.-](?:\d{2}|\d{4})),? (\d{1,2}:\d{2}(?::\d{2})?)(?: [APap][Mm])?\]? - ([^:]+): (.+)$/gm;
  
  const messages: Message[] = [];
  let match: RegExpExecArray | null;
  let id = 0;
  
  // Execute regex for each message match
  while ((match = messageRegex.exec(text)) !== null) {
    try {
      const [_, datePart, timePart, sender, content] = match;
      
      // Parse date (handling various formats)
      const dateObj = parseWhatsAppDate(datePart, timePart);
      
      // Determine message type
      let type: Message['type'] = 'text';
      let processedContent = content.trim();
      let mediaUrl: string | undefined = undefined;
      
      if (content.includes('<Media omitted>') || content.includes('image omitted') || content.includes('video omitted')) {
        type = 'media';
        processedContent = content.includes('image omitted') ? 'Image' : content.includes('video omitted') ? 'Video' : 'Media attachment';
      } else if (content.includes('audio omitted') || content.includes('voice message omitted')) {
        type = 'audio';
        processedContent = 'Voice message';
      } else if (content.includes('This message was deleted') || content.includes('You deleted this message')) {
        type = 'deleted';
        processedContent = 'This message was deleted';
      }
      
      messages.push({
        id: `msg-${id++}`,
        timestamp: dateObj.toISOString(),
        sender: sender.trim(),
        content: processedContent,
        type,
        mediaUrl
      });
    } catch (err) {
      console.error('Error parsing message:', match[0], err);
      // Continue to next message on error
    }
  }
  
  // Sort messages by timestamp
  return messages.sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
};

// Helper function to parse various WhatsApp date formats
const parseWhatsAppDate = (datePart: string, timePart: string): Date => {
  let day: number, month: number, year: number;
  
  // Handle different date separators and formats
  if (datePart.includes('/')) {
    [day, month, year] = datePart.split('/').map(Number);
  } else if (datePart.includes('-')) {
    [day, month, year] = datePart.split('-').map(Number);
  } else if (datePart.includes('.')) {
    [day, month, year] = datePart.split('.').map(Number);
  } else {
    throw new Error(`Unsupported date format: ${datePart}`);
  }
  
  // Handle 2-digit years
  if (year < 100) {
    year += 2000;
  }
  
  // Parse time
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  
  // JavaScript months are 0-indexed
  return new Date(year, month - 1, day, hours, minutes, seconds || 0);
};

// Extract message metadata from the file content
export const extractMessageMetadata = (text: string): {
  participantNames: string[];
  dateRange: { first: Date | null; last: Date | null };
  messageCount: number;
} => {
  // Get unique participants
  const participantRegex = /^\[?(?:\d{1,2}[\/.-]\d{1,2}[\/.-](?:\d{2}|\d{4})),? (?:\d{1,2}:\d{2}(?::\d{2})?)(?: [APap][Mm])?\]? - ([^:]+): /gm;
  
  const participants = new Set<string>();
  let match: RegExpExecArray | null;
  
  while ((match = participantRegex.exec(text)) !== null) {
    participants.add(match[1].trim());
  }
  
  // Get message count
  const messageCount = (text.match(/^\[?(?:\d{1,2}[\/.-]\d{1,2}[\/.-](?:\d{2}|\d{4})),? (?:\d{1,2}:\d{2}(?::\d{2})?)(?: [APap][Mm])?\]? - (?:[^:]+): /gm) || []).length;
  
  // Get date range - first and last message
  const dateRegex = /^\[?(\d{1,2}[\/.-]\d{1,2}[\/.-](?:\d{2}|\d{4})),? (\d{1,2}:\d{2}(?::\d{2})?)(?: [APap][Mm])?\]? - /gm;
  
  let firstDate: Date | null = null;
  let lastDate: Date | null = null;
  let dateMatch: RegExpExecArray | null;
  
  // Find first date
  dateMatch = dateRegex.exec(text);
  if (dateMatch) {
    try {
      firstDate = parseWhatsAppDate(dateMatch[1], dateMatch[2]);
    } catch (e) {
      console.error('Error parsing first date:', e);
    }
  }
  
  // Find last date by iterating through all matches
  while ((dateMatch = dateRegex.exec(text)) !== null) {
    try {
      lastDate = parseWhatsAppDate(dateMatch[1], dateMatch[2]);
    } catch (e) {
      console.error('Error parsing date in loop:', e);
    }
  }
  
  return {
    participantNames: Array.from(participants),
    dateRange: { first: firstDate, last: lastDate },
    messageCount
  };
};

// Utility function to split chat into days for efficient rendering
export const groupMessagesByDate = (messages: Message[]): Record<string, Message[]> => {
  const groups: Record<string, Message[]> = {};
  
  messages.forEach(message => {
    const date = new Date(message.timestamp);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push(message);
  });
  
  return groups;
};