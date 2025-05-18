import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Message, parseWhatsAppChat } from '../lib/parser';
import { getStoredData, storeData, clearAllData } from '../lib/storage';

interface ChatContextProps {
  messages: Message[];
  userIdentity: string | null;
  loading: boolean;
  error: string | null;
  importChatFile: (file: File, userName: string) => Promise<void>;
  addMessage: (message: Message) => void;
  clearChat: () => Promise<void>;
  exportData: () => Promise<Blob>;
  exportPDF: () => Promise<void>;
}

const defaultContext: ChatContextProps = {
  messages: [],
  userIdentity: null,
  loading: false,
  error: null,
  importChatFile: async () => {},
  addMessage: () => {},
  clearChat: async () => {},
  exportData: async () => new Blob(),
  exportPDF: async () => {},
};

export const ChatContext = createContext<ChatContextProps>(defaultContext);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userIdentity, setUserIdentity] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from storage on initial mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const storedData = await getStoredData();
        
        if (storedData) {
          setMessages(storedData.messages || []);
          setUserIdentity(storedData.userIdentity || null);
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load your chat data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Save data to storage whenever messages or userIdentity changes
  useEffect(() => {
    const saveData = async () => {
      if (!loading) {
        try {
          await storeData({ messages, userIdentity });
        } catch (err) {
          console.error('Error saving data:', err);
          setError('Failed to save your latest changes. Please check your storage permissions.');
        }
      }
    };

    saveData();
  }, [messages, userIdentity, loading]);

  // Import chat from file
  const importChatFile = useCallback(async (file: File, userName: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const fileText = await file.text();
      const parsedMessages = await parseWhatsAppChat(fileText);
      
      if (parsedMessages.length === 0) {
        throw new Error('No messages found in the file. Please check the file format.');
      }
      
      setMessages(parsedMessages);
      setUserIdentity(userName);
    } catch (err) {
      console.error('Error importing chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to import chat file.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new message (for diary entries, etc.)
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Clear all chat data
  const clearChat = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await clearAllData();
      setMessages([]);
      setUserIdentity(null);
    } catch (err) {
      console.error('Error clearing chat data:', err);
      setError('Failed to clear your data. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Export all data as JSON
  const exportData = useCallback(async (): Promise<Blob> => {
    const exportData = {
      messages,
      userIdentity,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    return blob;
  }, [messages, userIdentity]);

  // Export as PDF
  const exportPDF = useCallback(async (): Promise<void> => {
    try {
      // In a real app, this would use a PDF generation library or service
      // This is a simplified mock implementation
      console.log('Generating PDF for', messages.length, 'messages');
      
      // Simulate PDF generation time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Normally, this would return a PDF blob or trigger a download
      console.log('PDF export completed');
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Failed to generate PDF. Please try again.');
      throw err;
    }
  }, [messages]);

  const value: ChatContextProps = {
    messages,
    userIdentity,
    loading,
    error,
    importChatFile,
    addMessage,
    clearChat,
    exportData,
    exportPDF,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;