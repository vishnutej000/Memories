import React, { createContext, useState, useCallback, useEffect } from 'react';
import { ChatFile, ChatMetadata } from '../types/chat.types';
import { ChatService } from '../api/chat.service';

interface ChatContextType {
  activeChats: ChatFile[];
  selectedChat: ChatMetadata | null;
  isLoading: boolean;
  error: string | null;
  fetchChats: () => Promise<void>;
  selectChat: (chatId: string) => Promise<ChatMetadata | null>;
  deleteChat: (chatId: string) => Promise<void>;
  clearError: () => void;
}

export const ChatContext = createContext<ChatContextType>({
  activeChats: [],
  selectedChat: null,
  isLoading: false,
  error: null,
  fetchChats: async () => {},
  selectChat: async () => null,
  deleteChat: async () => {},
  clearError: () => {},
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeChats, setActiveChats] = useState<ChatFile[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chats on mount
  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const chats = await ChatService.getAllChats();
      setActiveChats(chats);
    } catch (err: any) {
      console.error('Error fetching chats:', err);
      setError(err.message || 'Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectChat = useCallback(async (chatId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await ChatService.getMessages(chatId, 1, 1);
      setSelectedChat(result.metadata);
      return result.metadata;
    } catch (err: any) {
      console.error('Error selecting chat:', err);
      setError(err.message || 'Failed to load chat');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await ChatService.deleteChat(chatId);
      setActiveChats(prev => prev.filter(chat => chat.id !== chatId));
      if (selectedChat && selectedChat.id === chatId) {
        setSelectedChat(null);
      }
    } catch (err: any) {
      console.error('Error deleting chat:', err);
      setError(err.message || 'Failed to delete chat');
    } finally {
      setIsLoading(false);
    }
  }, [selectedChat]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        activeChats,
        selectedChat,
        isLoading,
        error,
        fetchChats,
        selectChat,
        deleteChat,
        clearError,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};