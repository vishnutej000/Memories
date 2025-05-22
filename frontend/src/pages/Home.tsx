import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WhatsAppChat } from '../types';
import { getAllChats } from '../services/storageservices';
import { uploadChatFile } from '../services/whatsappServices';
import { useTheme } from '../Components/contexts/ThemeContext';

import Spinner from '../Components/UI/Spinner';
import {  formatRelativeTime } from '../utils/date.Utils';

interface HomeProps {
  hasData: boolean;
}

const Home: React.FC<HomeProps> = ({ hasData }) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Load chats
  useEffect(() => {
    const loadChats = async () => {
      try {
        setIsLoading(true);
        const chatsList = await getAllChats();
        setChats(chatsList);
      } catch (err) {
        console.error('Error loading chats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chats');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (hasData) {
      loadChats();
    } else {
      setIsLoading(false);
    }
  }, [hasData]);
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      setError(null);
      
      // Upload and parse chat
      const chat = await uploadChatFile(file, (progress) => {
        setUploadProgress(progress);
      });
      
      // Add to chats list
      setChats(prev => [...prev, chat]);
      
      // Reset upload state
      setUploadProgress(0);
      e.target.value = '';
      
      // Navigate to chat view
      navigate(`/chat/${chat.id}`);
    } catch (err) {
      console.error('Error uploading chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload chat');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Spinner size="large" text="Loading chats..." />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-whatsapp-teal dark:bg-gray-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h1 className="text-xl font-bold">WhatsApp Memory Vault</h1>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-white/10 focus:outline-none"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            <a href="/settings">
              <button className="p-2 rounded-full hover:bg-white/10 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </a>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-6 px-4">
        {/* Upload box */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Import WhatsApp Chat
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Upload a WhatsApp chat export file (.txt) to start exploring your conversations.
          </p>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <label className="cursor-pointer bg-whatsapp-dark hover:bg-whatsapp-teal text-white font-medium py-2 px-4 rounded-md inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {isUploading ? 'Uploading...' : 'Select WhatsApp Export File'}
                <input
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
            
            {isUploading && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-whatsapp-dark dark:bg-whatsapp-light h-2.5 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            
            {error && (
              <div className="text-red-500 dark:text-red-400 text-sm text-center">
                {error}
              </div>
            )}
          </div>
        </div>
        
        {/* Chat list */}
        {chats.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Your Chats
            </h2>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {chats.map(chat => (
                <div
                  key={chat.id}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/chat/${chat.id}`)}
                >
                  <div className="flex items-center mb-3">
                    <div className="bg-whatsapp-dark dark:bg-whatsapp-light h-10 w-10 rounded-full flex items-center justify-center text-white dark:text-gray-900 text-lg font-medium mr-3">
                      {chat.isGroup ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white truncate max-w-[200px]">
                        {chat.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {chat.participants.length} participants
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="bg-whatsapp-dark/10 dark:bg-whatsapp-light/10 text-whatsapp-dark dark:text-whatsapp-light px-2 py-0.5 rounded-full text-xs font-medium">
                        {chat.messageCount.toLocaleString()} messages
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(chat.endDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-10 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Chats Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Upload your first WhatsApp chat export to get started.
            </p>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-auto py-6 px-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          WhatsApp Memory Vault © 2025 • All your data is stored locally in your browser
        </p>
      </footer>
    </div>
  );
};

export default Home;