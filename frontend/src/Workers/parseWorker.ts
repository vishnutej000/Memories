import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../types';

/**
 * Web Worker for parsing WhatsApp chat export files
 * This runs in a separate thread to avoid blocking the main UI
 */

self.addEventListener('message', (event) => {
  const { text, id } = event.data;
  
  try {
    // Parse the chat
    const result = parseWhatsAppChat(text);
    
    // Send result back to the main thread
    self.postMessage({
      success: true,
      result,
      id
    });
  } catch (error) {
    // Send error back to the main thread
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error parsing chat',
      id
    });
  }
});

/**
 * Parse WhatsApp chat export text
 */
function parseWhatsAppChat(text: string): {
  messages: ChatMessage[];
  metadata: {
    participants: string[];
    startDate: string;
    endDate: string;
  };
} {
  // Normalize line endings
  const normalizedText = text.replace(/\r\n/g, '\n');
  const lines = normalizedText.split('\n');
  
  // WhatsApp message line pattern:
  // [DD/MM/YY, HH:MM:SS] Sender: Message
  // Or for newer formats:
  // [DD/MM/YYYY, HH:MM:SS] Sender: Message
  // Or for formats with 12h clock:
  // [DD/MM/YY, HH:MM:SS AM/PM] Sender: Message
  // Or for US format:
  // [MM/DD/YY, HH:MM:SS] Sender: Message
  
  // The regex to match these patterns
  const messageRegex = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{1,2}(?::\d{1,2})?(?:\s*[AP]M)?)\]\s*(.*?):\s*(.*)$/;
  
  // Process each line
  let currentMessage: ChatMessage | null = null;
  const messages: ChatMessage[] = [];
  const uniqueSenders = new Set<string>();
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Try to match the line against the message pattern
    const match = line.match(messageRegex);
    
    if (match) {
      // It's a new message, save the previous one if exists
      if (currentMessage) {
        messages.push(currentMessage);
      }
      
      // Extract message parts
      const [, datePart, timePart, sender, content] = match;
      
      // Parse date
      try {
        const timestamp = parseWhatsAppDate(`${datePart}, ${timePart}`);
        const date = new Date(timestamp);
        
        // Update min/max dates
        if (!minDate || date < minDate) minDate = date;
        if (!maxDate || date > maxDate) maxDate = date;
        
        // Add sender to unique senders
        uniqueSenders.add(standardizeParticipantName(sender));
        
        // Create new message
        currentMessage = {
          id: uuidv4(),
          sender: standardizeParticipantName(sender),
          content: content,
          timestamp: timestamp,
          isMedia: content.includes('<Media omitted>') ||
                   content.includes('<image omitted>') ||
                   content.includes('<video omitted>'),
          isDeleted: content.includes('This message was deleted'),
          isForwarded: content.includes('Forwarded')
        };
        
        // Count emojis in the message
        const emojis = content.match(/[\p{Emoji_Presentation}\p{Emoji}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]/gu);
        if (emojis) {
          currentMessage.emojiCount = emojis.length;
        }
      } catch (error) {
        console.error(`Error parsing date: ${datePart}, ${timePart}`, error);
        // Skip this message
        currentMessage = null;
      }
    } else if (currentMessage) {
      // This line is a continuation of the previous message
      currentMessage.content += '\n' + line;
    }
  }
  
  // Add the last message if exists
  if (currentMessage) {
    messages.push(currentMessage);
  }
  
  // Convert sets to arrays and sort participants
  const participants = Array.from(uniqueSenders).sort();
  
  // Return the parsed data
  return {
    messages,
    metadata: {
      participants,
      startDate: minDate ? minDate.toISOString() : new Date().toISOString(),
      endDate: maxDate ? maxDate.toISOString() : new Date().toISOString()
    }
  };
}

/**
 * Parse WhatsApp date string to ISO string
 */
function parseWhatsAppDate(dateString: string): string {
  // Extract date and time parts
  const [datePart, timePart] = dateString.split(', ');
  
  // Split date part
  const dateParts = datePart.split('/');
  
  // Handle different date formats (DD/MM/YY, MM/DD/YY, etc.)
  let day: string | number, month: string | number, year: string | number;
  
  if (dateParts.length === 3) {
    // Determine which format is being used based on the year part length
    const yearPartIndex = dateParts.findIndex(p => p.length === 4);
    
    if (yearPartIndex === 2) {
      // DD/MM/YYYY format
      [day, month, year] = dateParts;
    } else if (yearPartIndex === 0) {
      // YYYY/MM/DD format
      [year, month, day] = dateParts;
    } else {
      // Most common WhatsApp format: DD/MM/YY
      [day, month, year] = dateParts;
      // Expand 2-digit year to 4-digit
      year = expandYear(parseInt(year));
    }
  } else {
    throw new Error(`Unsupported date format: ${datePart}`);
  }
  
  // Process time part
  let hours = 0, minutes = 0, seconds = 0;
  const isPM = timePart.includes('PM');
  const isAM = timePart.includes('AM');
  
  // Remove AM/PM and split time parts
  const time = timePart.replace(/\s*[AP]M$/, '').split(':');
  
  if (time.length >= 2) {
    hours = parseInt(time[0]);
    minutes = parseInt(time[1]);
    
    // Handle 12-hour format
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    
    // Add seconds if provided
    if (time.length >= 3) {
      seconds = parseInt(time[2]);
    }
  } else {
    throw new Error(`Unsupported time format: ${timePart}`);
  }
  
  // Create ISO date string
  try {
    const dateObj = new Date(
      parseInt(year.toString()),
      parseInt(month.toString()) - 1, // Month is 0-based in JS
      parseInt(day.toString()),
      hours,
      minutes,
      seconds
    );
    
    // Validate date
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date created from: ${dateString}`);
    }
    
    return dateObj.toISOString();
  } catch (error) {
    throw new Error(`Error creating date from: ${dateString}, ${error}`);
  }
}

/**
 * Expand 2-digit year to 4-digit year
 */
function expandYear(twoDigitYear: number): number {
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  
  // Make sure the year is in the right century
  if (twoDigitYear + currentCentury > currentYear + 50) {
    return twoDigitYear + currentCentury - 100;
  } else {
    return twoDigitYear + currentCentury;
  }
}

/**
 * Standardize participant name
 * Changes WhatsApp's contact formats to consistent format
 */
function standardizeParticipantName(name: string): string {
  // If it's "You", keep it as is
  if (name.trim() === 'You') return 'You';
  
  // Format: "John Doe (+1 234-567-8900)"
  // Or: "John (Work)"
  const contactMatch = name.match(/^([^(]+?)(?:\s*\([^)]+\))?$/);
  if (contactMatch) {
    return contactMatch[1].trim();
  }
  
  return name.trim();
}

export {};