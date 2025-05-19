import { useCallback } from 'react';
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'whatsapp-memory-vault';
const DB_VERSION = 1;

interface DBSchema {
  chat_metadata: {
    key: string;
    value: any;
    indexes: { 'by_date': string };
  };
  messages: {
    key: string;
    value: any;
    indexes: { 
      'by_chat': string;
      'by_date': [string, string];
      'by_sender': [string, string];
    };
  };
  audio_notes: {
    key: [string, string];
    value: any;
    indexes: { 'by_chat_date': [string, string] };
  };
  diary_entries: {
    key: [string, string];
    value: any;
    indexes: { 'by_chat_date': [string, string] };
  };
  date_ranges: {
    key: string;
    value: any;
  };
}

export const useIndexedDB = () => {
  const getDb = useCallback(async () => {
    return openDB<DBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('chat_metadata')) {
          const chatStore = db.createObjectStore('chat_metadata', { keyPath: 'id' });
          chatStore.createIndex('by_date', 'uploaded_at', { unique: false });
        }

        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('by_chat', 'chat_id', { unique: false });
          messageStore.createIndex('by_date', ['chat_id', 'date'], { unique: false });
          messageStore.createIndex('by_sender', ['chat_id', 'sender'], { unique: false });
        }

        if (!db.objectStoreNames.contains('audio_notes')) {
          const audioStore = db.createObjectStore('audio_notes', { 
            keyPath: ['chatId', 'date'] 
          });
          audioStore.createIndex('by_chat_date', ['chatId', 'date'], { unique: true });
        }

        if (!db.objectStoreNames.contains('diary_entries')) {
          const diaryStore = db.createObjectStore('diary_entries', { 
            keyPath: ['chatId', 'date'] 
          });
          diaryStore.createIndex('by_chat_date', ['chatId', 'date'], { unique: true });
        }

        if (!db.objectStoreNames.contains('date_ranges')) {
          db.createObjectStore('date_ranges', { keyPath: 'chatId' });
        }
      },
    });
  }, []);

  const put = useCallback(async <T>(
    storeName: keyof DBSchema, 
    item: T
  ): Promise<T> => {
    const db = await getDb();
    await db.put(storeName, item);
    return item;
  }, [getDb]);

  const get = useCallback(async <T>(
    storeName: keyof DBSchema, 
    key: IDBKeyRange | string | string[]
  ): Promise<T | undefined> => {
    const db = await getDb();
    return db.get(storeName, key);
  }, [getDb]);

  const getAll = useCallback(async <T>(
    storeName: keyof DBSchema
  ): Promise<T[]> => {
    const db = await getDb();
    return db.getAll(storeName);
  }, [getDb]);

  const getFromIndex = useCallback(async <T>(
    storeName: keyof DBSchema,
    indexName: string,
    key: IDBKeyRange | string | string[]
  ): Promise<T | undefined> => {
    const db = await getDb();
    return db.getFromIndex(storeName, indexName, key);
  }, [getDb]);

  const getAllFromIndex = useCallback(async <T>(
    storeName: keyof DBSchema,
    indexName: string,
    key: IDBKeyRange | string | string[]
  ): Promise<T[]> => {
    const db = await getDb();
    return db.getAllFromIndex(storeName, indexName, key);
  }, [getDb]);

  const deleteItem = useCallback(async (
    storeName: keyof DBSchema,
    key: IDBKeyRange | string | string[]
  ): Promise<void> => {
    const db = await getDb();
    await db.delete(storeName, key);
  }, [getDb]);

  const clearStore = useCallback(async (
    storeName: keyof DBSchema
  ): Promise<void> => {
    const db = await getDb();
    await db.clear(storeName);
  }, [getDb]);

  return {
    put,
    get,
    getAll,
    getFromIndex,
    getAllFromIndex,
    deleteItem,
    clearStore,
  };
};