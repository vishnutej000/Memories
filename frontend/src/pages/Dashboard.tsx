import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllChats } from '../services/whatsappService';
import { hasAnyData, getStorageSize } from '../services/storageService';
import { WhatsAppChat } from '../types';
import { useTheme } from '../Components/contexts/ThemeContext';
import Button from '../components/UI/Button';
import Spinner from '../components/UI/Spinner';
import Modal from '../components/UI/Modal';
import WhatsAppUploader from '../components/FileUpload/WhatsAppUploader';
import { formatDate } from '../utils/dateUtils';

const Dashboard: React.FC = () => {
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [dbSize, setDbSize] = useState({ size: 0, formatted: '0 B' });
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  // Load chats and check if data exists
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Check if any data exists
        const dataExists = await hasAnyData();
        setHasData(dataExists);
        
        // Get storage size
        const size = await getStorageSize();
        setDbSize(size);
        
        // Load chats if data exists
        if (dataExists) {
          const allChats = await getAllChats();
          setChats(allChats);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Handle chat upload completion
  const handleUploadComplete = (chat: WhatsAppChat) => {
    setChats(prevChats => [chat, ...prevChats]);
    setShowUploadModal(false);
    setHasData(true);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Spinner size="large" text="Loading your vault..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-whatsapp-teal dark:bg-gray-800 text-white py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">WhatsApp Memory Vault</h1>
          
          <div className="flex items-center space-x-4">
            <Link to="/settings">
              <Button 
                variant="outline" 
                size="small"
                className="border-white text-white hover:bg-white/10"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                }
              >
                Settings
              </Button>
            </Link>
            
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto py-8 px-4">
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
            <button
              className="ml-4 text-red-700 dark:text-red-300 underline"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}
        
        {/* Welcome section */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            {hasData ? 'Welcome back to your Memory Vault' : 'Welcome to WhatsApp Memory Vault'}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {hasData 
              ? 'Explore your conversations, journal entries, and insights below.' 
              : 'Upload your first WhatsApp chat export to get started preserving your memories.'}
          </p>
          
          {hasData && (
            <div className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
              Storage used: {dbSize.formatted}
            </div>
          )}
        </div>
        
        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {/* Upload Chat */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col">
            <div className="mb-4 text-whatsapp-dark dark:text-whatsapp-light">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Upload Chat</h3>
            <p className="text-gray-600 dark:text-gray-300 flex-grow mb-4">
              Import a WhatsApp chat export to analyze and preserve your conversations.
            </p>
            <Button
              onClick={() => setShowUploadModal(true)}
              variant="primary"
              fullWidth
            >
              Upload Chat
            </Button>
          </div>
          
          {/* View Chats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col">
            <div className="mb-4 text-whatsapp-dark dark:text-whatsapp-light">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">My Chats</h3>
            <p className="text-gray-600 dark:text-gray-300 flex-grow mb-4">
              Browse and view your imported conversations in a familiar interface.
            </p>
            <Button
              onClick={() => navigate('/')}
              variant={hasData ? "primary" : "outline"}
              fullWidth
              disabled={!hasData}
            >
              {hasData ? 'View Chats' : 'No Chats Yet'}
            </Button>
          </div>
          
          {/* Diary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col">
            <div className="mb-4 text-whatsapp-dark dark:text-whatsapp-light">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Journal</h3>
            <p className="text-gray-600 dark:text-gray-300 flex-grow mb-4">
              Create diary entries linked to your chat history to capture your memories.
            </p>
            <Button
              onClick={() => navigate(hasData ? `/diary/${chats[0]?.id}` : '/')}
              variant={hasData ? "primary" : "outline"}
              fullWidth
              disabled={!hasData}
            >
              {hasData ? 'Write Journal' : 'Import a Chat First'}
            </Button>
          </div>
          
          {/* Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col">
            <div className="mb-4 text-whatsapp-dark dark:text-whatsapp-light">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Analytics</h3>
            <p className="text-gray-600 dark:text-gray-300 flex-grow mb-4">
              Discover insights about your conversations with sentiment analysis and more.
            </p>
            <Button
              onClick={() => navigate(hasData ? `/analytics/${chats[0]?.id}` : '/')}
              variant={hasData ? "primary" : "outline"}
              fullWidth
              disabled={!hasData}
            >
              {hasData ? 'View Analytics' : 'Import a Chat First'}
            </Button>
          </div>
          
          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col">
            <div className="mb-4 text-whatsapp-dark dark:text-whatsapp-light">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Search</h3>
            <p className="text-gray-600 dark:text-gray-300 flex-grow mb-4">
              Search through your conversations to find specific messages or topics.
            </p>
            <Button
              onClick={() => navigate(hasData ? `/chat/${chats[0]?.id}` : '/')}
              variant={hasData ? "primary" : "outline"}
              fullWidth
              disabled={!hasData}
            >
              {hasData ? 'Search Messages' : 'Import a Chat First'}
            </Button>
          </div>
          
          {/* Export */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col">
            <div className="mb-4 text-whatsapp-dark dark:text-whatsapp-light">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Export</h3>
            <p className="text-gray-600 dark:text-gray-300 flex-grow mb-4">
              Export your conversations and journal entries in various formats.
            </p>
            <Button
              onClick={() => navigate(hasData ? `/chat/${chats[0]?.id}` : '/')}
              variant={hasData ? "primary" : "outline"}
              fullWidth
              disabled={!hasData}
            >
              {hasData ? 'Export Data' : 'Import a Chat First'}
            </Button>
          </div>
        </div>
        
        {/* Recent Chats Section */}
        {hasData && chats.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Recent Chats</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chats.slice(0, 6).map(chat => (
                <div 
                  key={chat.id} 
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 line-clamp-1" title={chat.name}>
                      {chat.name}
                    </h3>
                    
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-3">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                        {chat.messageCount.toLocaleString()}
                      </div>
                      
                      <div>
                        <span className="text-xs">
                          {formatDate(chat.startDate)} - {formatDate(chat.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
                    <Link 
                      to={`/chat/${chat.id}`}
                      className="p-2 text-center text-sm font-medium text-whatsapp-dark dark:text-whatsapp-light hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      View
                    </Link>
                    <Link 
                      to={`/diary/${chat.id}`}
                      className="p-2 text-center text-sm font-medium text-whatsapp-dark dark:text-whatsapp-light hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Diary
                    </Link>
                    <Link 
                      to={`/analytics/${chat.id}`}
                      className="p-2 text-center text-sm font-medium text-whatsapp-dark dark:text-whatsapp-light hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Analytics
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {chats.length > 6 && (
              <div className="mt-4 text-center">
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                >
                  View All Chats
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Quick Stats */}
        {hasData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-blue-500 dark:text-blue-400 text-3xl font-bold mb-1">
                  {chats.length}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Chats Imported
                </div>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-green-500 dark:text-green-400 text-3xl font-bold mb-1">
                  {chats.reduce((total, chat) => total + chat.messageCount, 0).toLocaleString()}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Total Messages
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-purple-500 dark:text-purple-400 text-3xl font-bold mb-1">
                  {chats.reduce((total, chat) => total + (chat.metadata?.totalEmojis || 0), 0).toLocaleString()}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Total Emojis
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="text-amber-500 dark:text-amber-400 text-3xl font-bold mb-1">
                  {chats.reduce((total, chat) => {
                    const start = new Date(chat.startDate);
                    const end = new Date(chat.endDate);
                    return total + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                  }, 0).toLocaleString()}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Days of History
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>WhatsApp Memory Vault &copy; {new Date().getFullYear()}</p>
          <p className="mt-1">Developed by vishnutej000</p>
        </div>
      </footer>
      
      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload WhatsApp Chat"
        size="medium"
      >
        <WhatsAppUploader onUploadComplete={handleUploadComplete} />
      </Modal>
    </div>
  );
};

export default Dashboard;