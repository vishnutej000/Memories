import { Message } from './parser';

// Define stored data structure
interface StoredData {
  messages: Message[];
  userIdentity: string | null;
  lastUpdated?: string;
}

// Storage keys
const STORAGE_KEY = 'whatsapp-memory-vault-data';
const VERSION_KEY = 'whatsapp-memory-vault-version';
const CURRENT_VERSION = '1.0.0';

// Check if IndexedDB is available
const isIndexedDBAvailable = (): boolean => {
  return 'indexedDB' in window;
};

// Open IndexedDB connection
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('WhatsAppMemoryVault', 1);
    
    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('chatData')) {
        db.createObjectStore('chatData', { keyPath: 'id' });
      }
    };
  });
};

// Store data in IndexedDB
const storeInIndexedDB = async (data: StoredData): Promise<void> => {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chatData'], 'readwrite');
      const store = transaction.objectStore('chatData');
      
      const request = store.put({
        id: STORAGE_KEY,
        ...data,
        lastUpdated: new Date().toISOString()
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store data in IndexedDB'));
      
      transaction.oncomplete = () => db.close();
    });
  } catch (err) {
    console.error('Error storing in IndexedDB:', err);
    throw err;
  }
};

// Get data from IndexedDB
const getFromIndexedDB = async (): Promise<StoredData | null> => {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chatData'], 'readonly');
      const store = transaction.objectStore('chatData');
      
      const request = store.get(STORAGE_KEY);
      
      request.onsuccess = () => {
        const data = request.result;
        resolve(data ? {
          messages: data.messages || [],
          userIdentity: data.userIdentity || null,
          lastUpdated: data.lastUpdated
        } : null);
      };
      
      request.onerror = () => reject(new Error('Failed to get data from IndexedDB'));
      
      transaction.oncomplete = () => db.close();
    });
  } catch (err) {
    console.error('Error getting from IndexedDB:', err);
    throw err;
  }
};

// Clear data from IndexedDB
const clearFromIndexedDB = async (): Promise<void> => {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chatData'], 'readwrite');
      const store = transaction.objectStore('chatData');
      
      const request = store.delete(STORAGE_KEY);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear data from IndexedDB'));
      
      transaction.oncomplete = () => db.close();
    });
  } catch (err) {
    console.error('Error clearing from IndexedDB:', err);
    throw err;
  }
};

// Store data in LocalStorage (fallback)
const storeInLocalStorage = (data: StoredData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      lastUpdated: new Date().toISOString()
    }));
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
  } catch (err) {
    console.error('Error storing in localStorage:', err);
    throw new Error('Failed to store data. You may be in private browsing mode or out of storage space.');
  }
};

// Get data from LocalStorage (fallback)
const getFromLocalStorage = (): StoredData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    
    if (!data) {
      return null;
    }
    
    const parsedData = JSON.parse(data);
    return {
      messages: parsedData.messages || [],
      userIdentity: parsedData.userIdentity || null,
      lastUpdated: parsedData.lastUpdated
    };
  } catch (err) {
    console.error('Error getting from localStorage:', err);
    return null;
  }
};

// Clear data from LocalStorage (fallback)
const clearFromLocalStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing from localStorage:', err);
    throw new Error('Failed to clear data from localStorage');
  }
};

// Store data using best available method
export const storeData = async (data: StoredData): Promise<void> => {
  if (isIndexedDBAvailable()) {
    try {
      await storeInIndexedDB(data);
      return;
    } catch (err) {
      console.warn('IndexedDB storage failed, falling back to localStorage:', err);
    }
  }
  
  // Fallback to localStorage
  storeInLocalStorage(data);
};

// Get stored data using best available method
export const getStoredData = async (): Promise<StoredData | null> => {
  if (isIndexedDBAvailable()) {
    try {
      const data = await getFromIndexedDB();
      if (data) {
        return data;
      }
    } catch (err) {
      console.warn('IndexedDB retrieval failed, falling back to localStorage:', err);
    }
  }
  
  // Fallback to localStorage
  return getFromLocalStorage();
};

// Clear all stored data
export const clearAllData = async (): Promise<void> => {
  if (isIndexedDBAvailable()) {
    try {
      await clearFromIndexedDB();
    } catch (err) {
      console.warn('IndexedDB clear failed, falling back to localStorage clear:', err);
    }
  }
  
  // Always try to clear localStorage as well
  clearFromLocalStorage();
};

// Get storage usage statistics
export const getStorageStats = async (): Promise<{ 
  size: number; 
  messageCount: number; 
  lastUpdated: string | null;
}> => {
  const data = await getStoredData();
  
  if (!data) {
    return {
      size: 0,
      messageCount: 0,
      lastUpdated: null
    };
  }
  
  // Estimate size by serializing and measuring
  const serialized = JSON.stringify(data);
  const size = new Blob([serialized]).size;
  
  return {
    size,
    messageCount: data.messages.length,
    lastUpdated: data.lastUpdated || null
  };
};