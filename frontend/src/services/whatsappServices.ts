import { v4 as uuidv4 } from 'uuid';
import { WhatsAppChat, ChatMessage, JournalEntry } from '../types';
import HybridStorageService from './hybridStorageService';
import APIService from './apiService';

/**
 * Service for handling WhatsApp chat data
 */

// Upload and parse a WhatsApp chat export file
export async function uploadChatFile(
  file: File,
  progressCallback?: (progress: number) => void,
  useBackend: boolean = true,
  selectedParticipant?: string
): Promise<WhatsAppChat> {
  if (useBackend) {
    return uploadChatFileWithBackend(file, progressCallback, selectedParticipant);
  } else {
    return uploadChatFileWithWorker(file, progressCallback);
  }
}

// Detect participants from file
export async function detectParticipants(file: File): Promise<string[]> {
  console.log('🔍 Starting participant detection for file:', file.name);
  try {
    const result = await APIService.detectParticipants(file);
    console.log('✅ Backend participant detection result:', result);
    return result;
  } catch (error) {
    console.error('❌ Backend participant detection failed, using fallback:', error);
    // Fallback to local detection
    const localResult = await detectParticipantsLocally(file);
    console.log('🔄 Local participant detection result:', localResult);
    return localResult;
  }
}

// Local participant detection fallback
async function detectParticipantsLocally(file: File): Promise<string[]> {
  console.log('🔍 Running local participant detection...');
  const text = await file.text();
  console.log('📄 File content preview:', text.substring(0, 200));
  
  const participants = new Set<string>();
    // System message patterns to exclude
  const systemMessagePatterns = [
    /Messages and calls are end-to-end encrypted/i,
    /You created group/i,
    /created this group/i,
    /added you/i,
    /removed/i,
    /left/i,
    /joined using this group's invite link/i,
    /Security code changed/i,
    /This business account is verified by WhatsApp/i,
    /changed their phone number/i,
    /changed the group description/i,
    /changed the subject to/i,
    /changed this group's icon/i,
    /deleted this group's icon/i,
    /Your security code with .* changed/i,
    /Missed voice call/i,
    /Missed video call/i,
    /Call ended/i,
    /Waiting for this message/i,
    // Additional comprehensive patterns
    /.+ added .+ to the group/i,
    /.+ removed .+ from the group/i,
    /.+ left the group/i,
    /.+ joined the group/i,
    /.+ changed .+ group name/i,
    /.+ changed .+ group photo/i,
    /.+ deleted .+ group photo/i,
    /.+ made .+ an admin/i,
    /.+ is no longer an admin/i,
    /Group invite link reset/i,
    /Only admins can edit group info/i,
    /Only admins can send messages/i,
    /All participants can now send messages/i,
    /Messages to this group are now secured/i,
    /<Media omitted>/i,
    /This message was deleted/i,
    /You're now an admin/i,
    /You're no longer an admin/i,
    /.+ added .+/i,
    /.+ removed .+/i,
    /Disappearing messages/i,
    /Auto-delete/i,
    /Business account/i,
    /Verified by WhatsApp/i,
    /\+\d{1,3} \d{1,4} \d{3,4} \d{4}/,  // Phone numbers
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/,  // Lines that start with just dates
    /^[A-Z]{3} \d{1,2}, \d{4}/,  // Month abbreviations like "JAN 15, 2024"
  ];
  
  function isSystemMessage(content: string): boolean {
    return systemMessagePatterns.some(pattern => pattern.test(content));
  }
    // Common WhatsApp message patterns
  const patterns = [
    /(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*[-–—]\s*([^:]+):\s*(.+)/gi,
    /\[(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM|am|pm)?)\]\s*([^:]+):\s*(.+)/gi,
    /(\d{1,2}\/\d{1,2}\/\d{2,4}\s+\d{1,2}:\d{2})\s*[-–—]\s*([^:]+):\s*(.+)/gi
  ];
    console.log('🔍 Testing regex patterns...');
  
  // Split text into lines and process each one
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Skip lines that are clearly system messages without participants
    // Pattern: DD/MM/YY, HH:MM am/pm - System message (no participant name)
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}, \d{1,2}:\d{2} (?:AM|PM|am|pm) - [^:]*$/.test(trimmedLine)) {
      console.log(`⏭️ Skipping system message line (no participant): ${trimmedLine.substring(0, 50)}...`);
      continue;
    }
    
    // Try each regex pattern on this line
    for (const pattern of patterns) {
      const match = pattern.exec(trimmedLine);
      if (match && match[2] && match[3]) {
        const participant = match[2].trim();
        const messageContent = match[3].trim();
        
        // Skip system messages
        if (isSystemMessage(messageContent)) {
          console.log(`⏭️ Skipping system message: ${messageContent.substring(0, 50)}...`);
          continue;
        }
        
        if (participant && participant.length > 0) {
          participants.add(participant);
          console.log(`✅ Found participant: "${participant}"`);
        }
        break; // Found a match, no need to try other patterns
      }
    }
  }
  
  const result = Array.from(participants).filter(p => p.length > 0);
  console.log('🎯 Final participants detected:', result);
  return result;
}

// Upload and parse using backend API
async function uploadChatFileWithBackend(
  file: File,
  progressCallback?: (progress: number) => void,
  selectedParticipant?: string
): Promise<WhatsAppChat> {
  try {
    if (progressCallback) progressCallback(10);

    // Upload to backend for parsing
    const userName = selectedParticipant || 'You';
    const result = await APIService.uploadWhatsAppFile(file, userName);
    
    if (progressCallback) progressCallback(70);

    // Convert backend format to frontend format
    const messages: ChatMessage[] = result.messages.map(msg => ({
      id: msg.id,
      sender: msg.sender,
      content: msg.content,
      timestamp: msg.timestamp,
      isMedia: msg.content.includes('<Media omitted>') || 
               msg.content.includes('<image omitted>') ||
               msg.content.includes('<video omitted>'),
      isDeleted: msg.content.includes('This message was deleted'),
      isForwarded: msg.content.includes('Forwarded')
    }));

    // Create chat object
    const chatName = extractChatName(file.name, result.participants);
    
    const chat: WhatsAppChat = {
      id: uuidv4(),
      name: chatName,
      participants: result.participants,
      messages,
      isGroup: result.participants.length > 2,
      startDate: result.date_range.start,
      endDate: result.date_range.end,
      messageCount: messages.length
    };

    // Save chat to local storage
    await HybridStorageService.saveChat(chat);
    
    if (progressCallback) progressCallback(100);
    
    return chat;
  } catch (error) {
    console.error('Backend upload failed, falling back to Web Worker:', error);
    // Fallback to Web Worker if backend fails
    return uploadChatFileWithWorker(file, progressCallback);
  }
}

// Upload and parse using Web Worker (fallback)
async function uploadChatFileWithWorker(
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
                await HybridStorageService.saveChat(chat);
                
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
    reader.onerror = () => {
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
export async function updateMessageSentiments(chatId: string, messages: ChatMessage[]): Promise<void> {  // Get current chat
  const chat = await HybridStorageService.getChat(chatId);
  
  // Update messages
  chat.messages = messages;
    // Save updated chat
  await HybridStorageService.saveChat(chat);
}

// Create or update a journal entry
export async function createOrUpdateJournalEntry(entry: JournalEntry): Promise<JournalEntry> {
  // For now, just return the entry - this would be implemented when journal functionality is added
  return entry;
}