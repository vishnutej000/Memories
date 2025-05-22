import { WhatsAppChat, JournalEntry } from '../types';

/**
 * IndexedDB helper for WhatsApp Memory Vault
 * This replaces the Dexie implementation with native IndexedDB
 */

// Database configuration
const DB_NAME = 'WhatsAppVault';
const DB_VERSION = 1;
const STORES = {
  CHATS: 'chats',
  JOURNAL_ENTRIES: 'journalEntries'
};

// IndexedDB instance
let dbInstance: IDBDatabase | null = null;

/**
 * Open the database connection
 */
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Set up the database when first created or version upgrade needed
    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.CHATS)) {
        const chatStore = db.createObjectStore(STORES.CHATS, { keyPath: 'id' });
        chatStore.createIndex('name', 'name', { unique: false });
        chatStore.createIndex('isGroup', 'isGroup', { unique: false });
        chatStore.createIndex('startDate', 'startDate', { unique: false });
        chatStore.createIndex('endDate', 'endDate', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORES.JOURNAL_ENTRIES)) {
        const journalStore = db.createObjectStore(STORES.JOURNAL_ENTRIES, { keyPath: 'id' });
        journalStore.createIndex('chatId', 'chatId', { unique: false });
        journalStore.createIndex('date', 'date', { unique: false });
        journalStore.createIndex('chatId_date', ['chatId', 'date'], { unique: false });
        journalStore.createIndex('createdAt', 'createdAt', { unique: false });
        journalStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Generic function to add an item to a store
 */
export async function addItem<T>(storeName: string, item: T): Promise<string> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);
    
    request.onsuccess = () => resolve(request.result as string);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic function to update an item in a store
 */
export async function updateItem<T>(storeName: string, item: T): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic function to get an item by ID
 */
export async function getItem<T>(storeName: string, id: string): Promise<T | undefined> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic function to delete an item by ID
 */
export async function deleteItem(storeName: string, id: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all items from a store
 */
export async function getAllItems<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all items from a store
 */
export async function clearStore(storeName: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Query items using an index
 */
export async function queryByIndex<T>(
  storeName: string, 
  indexName: string, 
  value: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

/**
 * WhatsApp Chat specific functions
 */

// Add or update a chat
export async function saveChat(chat: WhatsAppChat): Promise<void> {
  await updateItem(STORES.CHATS, chat);
}

// Get a chat by ID
export async function getChat(id: string): Promise<WhatsAppChat | undefined> {
  return getItem<WhatsAppChat>(STORES.CHATS, id);
}

// Get all chats
export async function getAllChats(): Promise<WhatsAppChat[]> {
  return getAllItems<WhatsAppChat>(STORES.CHATS);
}

// Delete a chat
export async function deleteChat(id: string): Promise<void> {
  await deleteItem(STORES.CHATS, id);
}

/**
 * Journal Entry specific functions
 */

// Add or update a journal entry
export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  await updateItem(STORES.JOURNAL_ENTRIES, entry);
}

// Get a journal entry by ID
export async function getJournalEntry(id: string): Promise<JournalEntry | undefined> {
  return getItem<JournalEntry>(STORES.JOURNAL_ENTRIES, id);
}

// Get all journal entries
export async function getAllJournalEntries(): Promise<JournalEntry[]> {
  return getAllItems<JournalEntry>(STORES.JOURNAL_ENTRIES);
}

// Get journal entries by chat ID
export async function getJournalEntriesByChatId(chatId: string): Promise<JournalEntry[]> {
  return queryByIndex<JournalEntry>(STORES.JOURNAL_ENTRIES, 'chatId', chatId);
}

// Get journal entries by chat ID and date
export async function getJournalEntriesByChatIdAndDate(
  chatId: string, 
  date: string
): Promise<JournalEntry[]> {
  return queryByIndex<JournalEntry>(
    STORES.JOURNAL_ENTRIES, 
    'chatId_date', 
    IDBKeyRange.only([chatId, date])
  );
}

// Delete a journal entry
export async function deleteJournalEntry(id: string): Promise<void> {
  await deleteItem(STORES.JOURNAL_ENTRIES, id);
}

/**
 * Export/Import functionality
 */

// Export database to JSON
export async function exportDatabase(): Promise<Blob> {
  // Export all tables
  const chats = await getAllChats();
  const journalEntries = await getAllJournalEntries();
  
  // Create export object
  const exportData = {
    version: DB_VERSION,
    data: {
      chats,
      journalEntries
    }
  };
  
  // Convert to JSON string
  const jsonString = JSON.stringify(exportData, null, 2);
  
  // Create blob
  return new Blob([jsonString], { type: 'application/json' });
}

// Import database from JSON
export async function importDatabase(jsonData: string): Promise<void> {
  try {
    // Parse JSON
    const importData = JSON.parse(jsonData);
    
    // Validate version
    if (!importData.version || importData.version > DB_VERSION) {
      throw new Error('Incompatible database version');
    }
    
    // Validate structure
    if (!importData.data || !importData.data.chats) {
      throw new Error('Invalid database structure');
    }
    
    // Clear existing data
    await clearStore(STORES.CHATS);
    await clearStore(STORES.JOURNAL_ENTRIES);
    
    // Import chats
    if (importData.data.chats && Array.isArray(importData.data.chats)) {
      for (const chat of importData.data.chats) {
        await saveChat(chat);
      }
    }
    
    // Import journal entries
    if (importData.data.journalEntries && Array.isArray(importData.data.journalEntries)) {
      for (const entry of importData.data.journalEntries) {
        await saveJournalEntry(entry);
      }
    }
    
    console.log('Database import completed');
  } catch (error) {
    console.error('Error importing database:', error);
    throw error;
  }
}

// Get database size in bytes
export async function getDatabaseSize(): Promise<number> {
  try {
    // Export to calculate size
    const blob = await exportDatabase();
    return blob.size;
  } catch (error) {
    console.error('Error getting database size:', error);
    return 0;
  }
}