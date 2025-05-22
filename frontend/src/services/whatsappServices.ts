import { v4 as uuidv4 } from 'uuid';
import { WhatsAppChat, ChatMessage, JournalEntry } from '../types';
import { saveChat, getChat, getJournalEntry, saveJournalEntry } from './storageservices';

/**
 * Service for handling WhatsApp chat data
 */

// Upload and parse a WhatsApp chat export file
export async function uploadChatFile(
  file: File,
  progressCallback?: (progress: number) => void
): Promise<WhatsAppChat> {
  return new Promise((resolve, reject) => {
    // Create file reader
    const reader = new FileReader();
    
    // Handle file load
    reader.onload = async (e) => {
      try {
        // Report progress
        if (progressCallback) progressCallback(50);
        
        // Get file content
        const text = e.target?.result as string;
        
        // Parse chat in a web worker to avoid blocking the UI
        const worker = new Worker(
          new URL('../workers/parseWorker.ts', import.meta.url),
          { type: 'module' }
        );
        
        // Generate a unique ID for this request
        const requestId = `parse_${Date.now()}`;
        
        // Set up message handler
        worker.onmessage = async (e) => {
          const { success, result, error, id } = e.data;
          
          // Check if this is our response
          if (id === requestId) {
            // Terminate worker
            worker.terminate();
            
            if (success) {
              try {
                // Extract parsed data
                const { messages, metadata } = result;
                
                // Create chat object
                const chatName = extractChatName(file.name, metadata.participants);
                
                const chat: WhatsAppChat = {
                  id: uuidv4(),
                  name: chatName,
                  participants: metadata.participants,
                  messages,
                  isGroup: metadata.participants.length > 2,
                  startDate: metadata.startDate,
                  endDate: metadata.endDate,
                  messageCount: messages.length
                };
                
                // Save chat to database
                await saveChat(chat);
                
                // Report progress
                if (progressCallback) progressCallback(100);
                
                // Resolve with chat
                resolve(chat);
              } catch (err) {
                reject(err);
              }
            } else {
              reject(new Error(error || 'Failed to parse chat'));
            }
          }
        };
        
        // Set up error handler
        worker.onerror = (error) => {
          worker.terminate();
          reject(new Error(`Worker error: ${error.message}`));
        };
        
        // Send text to worker
        worker.postMessage({
          text,
          id: requestId
        });
      } catch (err) {
        reject(err);
      }
    };
    
    // Handle errors
    reader.onerror = (e) => {
      reject(new Error('Error reading file'));
    };
    
    // Start reading file
    reader.readAsText(file);
    
    // Report initial progress
    if (progressCallback) progressCallback(10);
  });
}

// Extract a reasonable chat name from the file name and participants
function extractChatName(fileName: string, participants: string[]): string {
  // Try to get name from file name first
  let name = fileName.replace('.txt', '').trim();
  
  // If name contains "WhatsApp Chat with", extract the person's name
  if (name.includes('WhatsApp Chat with ')) {
    name = name.replace('WhatsApp Chat with ', '');
  }
  
  // If name is empty or too generic, use participants
  if (!name || name === 'WhatsApp Chat' || name === 'chat') {
    if (participants.length === 2) {
      // For 1-on-1 chats, use the other person's name
      name = participants.find(p => p !== 'You') || participants[0];
    } else {
      // For group chats, use the first few participants
      const maxParticipants = 3;
      const displayParticipants = participants.slice(0, maxParticipants);
      name = displayParticipants.join(', ');
      
      if (participants.length > maxParticipants) {
        name += ` + ${participants.length - maxParticipants} more`;
      }
    }
  }
  
  return name;
}

// Upload audio note and return URL
export async function uploadAudioNote(
  chatId: string,
  date: string,
  blob: Blob
): Promise<string> {
  // For local storage, we'll store the audio as a blob URL
  // In a real application, you'd upload this to a server
  const url = URL.createObjectURL(blob);
  
  // Storage ID using chatId and date
  const storageKey = `audio_${chatId}_${date}`;
  
  // We would normally use a proper storage solution, but for this demo
  // we'll just use localStorage to track the mapping
  const audioMapping = JSON.parse(localStorage.getItem('audioMapping') || '{}');
  audioMapping[storageKey] = url;
  localStorage.setItem('audioMapping', JSON.stringify(audioMapping));
  
  return url;
}

// Get an uploaded audio note
export function getAudioNote(chatId: string, date: string): string | null {
  const storageKey = `audio_${chatId}_${date}`;
  const audioMapping = JSON.parse(localStorage.getItem('audioMapping') || '{}');
  return audioMapping[storageKey] || null;
}

// Update message sentiment scores for a chat
export async function updateMessageSentiments(chatId: string, messages: ChatMessage[]): Promise<void> {
  // Get current chat
  const chat = await getChat(chatId);
  
  // Update messages
  chat.messages = messages;
  
  // Save updated chat
  await saveChat(chat);
}

// Create or update a journal entry
export async function createOrUpdateJournalEntry(entry: JournalEntry): Promise<JournalEntry> {
  // Save journal entry
  const id = await saveJournalEntry(entry);
  
  // Return updated entry
  return await getJournalEntry(id);
}