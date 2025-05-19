import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { format, parseISO } from 'date-fns';
import { BsWhatsapp, BsUpload, BsBarChart, BsBook, BsCalendar4Week, BsFilePdf } from 'react-icons/bs';
import LoadingSpinner from '../components/common/LoadingSpinner';

const HomePage: React.FC = () => {
  const { activeChats, fetchChats, isLoading, error } = useChat();
  
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);
  
  return (
    <div className="h-full">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-12">
          <BsWhatsapp className="text-primary-500 text-6xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            WhatsApp Memory Vault
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mt-2">
            Transform your WhatsApp chats into beautiful, interactive memories
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
        ) : !activeChats || activeChats.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Welcome to WhatsApp Memory Vault!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Get started by uploading your first WhatsApp chat export.
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <BsUpload className="mr-2" /> Upload Your First Chat
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
              Your Recent Chats
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {activeChats.slice(0, 4).map(chat => (
                <div key={chat.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-6">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">
                      {chat.is_group_chat 
                        ? chat.filename 
                        : chat.participants.filter(p => p !== 'You').join(', ') || chat.filename}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                      {chat.message_count} messages · From {format(parseISO(chat.date_range.start), 'MMM d, yyyy')} to {format(parseISO(chat.date_range.end), 'MMM d, yyyy')}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/chat/${chat.id}`}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm"
                      >
                        <BsWhatsapp className="mr-1" /> Chat
                      </Link>
                      <Link
                        to={`/diary/${chat.id}`}
                        className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-sm"
                      >
                        <BsBook className="mr-1" /> Diary
                      </Link>
                      <Link
                        to={`/stats/${chat.id}`}
                        className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-sm"
                      >
                        <BsBarChart className="mr-1" /> Stats
                      </Link>
                      <Link
                        to={`/memory-lane/${chat.id}`}
                        className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-sm"
                      >
                        <BsCalendar4Week className="mr-1" /> Memory Lane
                      </Link>
                      <Link
                        to={`/export/${chat.id}`}
                        className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full text-sm"
                      >
                        <BsFilePdf className="mr-1" /> Export
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Link
                to="/upload"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                <BsUpload className="mr-2" /> Upload Another Chat
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;