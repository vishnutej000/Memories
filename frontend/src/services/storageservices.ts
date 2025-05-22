import { v4 as uuidv4 } from 'uuid';
import { WhatsAppChat, JournalEntry } from '../types';
import {
  saveChat as idbSaveChat,
  getChat as idbGetChat,
  getAllChats as idbGetAllChats,
  deleteItem,
  saveJournalEntry as idbSaveJournalEntry,
  getJournalEntry as idbGetJournalEntry,
  getJournalEntriesByChatId,
  getJournalEntriesByChatIdAndDate,
  clearStore,
  queryByIndex,
  exportDatabase,
  importDatabase,
  openDatabase
} from '../utils/indexedDBHelper';

/**
 * Service for managing chat and journal storage using IndexedDB
 */

// Store names
const STORES = {
  CHATS: 'chats',
  JOURNAL_ENTRIES: 'journalEntries'
};

// Ensure database is initialized
openDatabase();

// Save a chat to the database
export async function saveChat(chat: WhatsAppChat): Promise<string> {
  // Ensure chat has an ID
  if (!chat.id) {
    chat.id = uuidv4();
  }
  
  // Ensure chat has required fields
  chat.messageCount = chat.messages.length;
  
  // Save chat
  await idbSaveChat(chat);
  
  return chat.id;
}

// Get a chat by ID
export async function getChat(chatId: string): Promise<WhatsAppChat> {
  const chat = await idbGetChat(chatId);
  
  if (!chat) {
    throw new Error(`Chat with ID ${chatId} not found`);
  }
  
  return chat;
}

// Get all chats
export async function getAllChats(): Promise<WhatsAppChat[]> {
  return idbGetAllChats();
}

// Delete a chat by ID
export async function deleteChat(chatId: string): Promise<void> {
  // Delete chat
  await deleteItem(STORES.CHATS, chatId);
  
  // Delete associated journal entries
  const journalEntries = await getJournalEntriesByChatId(chatId);
  for (const entry of journalEntries) {
    await deleteItem(STORES.JOURNAL_ENTRIES, entry.id);
  }
}

// Check if any data exists
export async function hasAnyData(): Promise<boolean> {
  const chats = await idbGetAllChats();
  return chats.length > 0;
}

// Save a journal entry
export async function saveJournalEntry(entry: JournalEntry): Promise<string> {
  // Ensure entry has an ID
  if (!entry.id) {
    entry.id = uuidv4();
  }
  
  // Ensure timestamps are set
  const now = new Date().toISOString();
  
  if (!entry.createdAt) {
    entry.createdAt = now;
  }
  
  entry.updatedAt = now;
  
  // Save entry
  await idbSaveJournalEntry(entry);
  
  return entry.id;
}

// Get a journal entry by ID
export async function getJournalEntry(entryId: string): Promise<JournalEntry> {
  const entry = await idbGetJournalEntry(entryId);
  
  if (!entry) {
    throw new Error(`Journal entry with ID ${entryId} not found`);
  }
  
  return entry;
}

// Get all journal entries for a chat
export async function getJournalEntriesForChat(chatId: string): Promise<JournalEntry[]> {
  return getJournalEntriesByChatId(chatId);
}

// Get journal entry for a specific date in a chat
export async function getJournalEntryForDate(chatId: string, date: string): Promise<JournalEntry | undefined> {
  const entries = await getJournalEntriesByChatIdAndDate(chatId, date);
  return entries.length > 0 ? entries[0] : undefined;
}

// Delete a journal entry by ID
export async function deleteJournalEntry(entryId: string): Promise<void> {
  await deleteItem(STORES.JOURNAL_ENTRIES, entryId);
}

// Create or update a journal entry
export async function createOrUpdateJournalEntry(entry: JournalEntry): Promise<JournalEntry> {
  // Save journal entry
  const id = await saveJournalEntry(entry);
  
  // Return updated entry
  return await getJournalEntry(id);
}

// Clear all data
export async function clearAllData(): Promise<void> {
  await clearStore(STORES.CHATS);
  await clearStore(STORES.JOURNAL_ENTRIES);
}

// Export database to file
export async function exportDatabaseToFile(): Promise<{ blob: Blob; filename: string }> {
  const blob = await exportDatabase();
  const filename = `whatsapp_memory_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
  
  return { blob, filename };
}

// Import database from file
export async function importDatabaseFromFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        await importDatabase(jsonData);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (e) => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
}