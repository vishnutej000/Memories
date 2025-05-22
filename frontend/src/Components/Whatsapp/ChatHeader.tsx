import React from 'react';
import { Link } from 'react-router-dom';
import { WhatsAppChat } from '../../types';
import Button from '../UI/Button';

interface ChatHeaderProps {
  chat: WhatsAppChat;
  onSearch: () => void;
  onExport: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ chat, onSearch, onExport }) => {
  return (
    <header className="bg-whatsapp-teal dark:bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          
          <div className="flex items-center">
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
              <h1 className="font-bold text-lg">{chat.name}</h1>
              <p className="text-xs text-gray-200 dark:text-gray-300">
                {chat.participants.length} participants • {chat.messageCount.toLocaleString()} messages
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={onSearch}
            variant="outline"
            size="small"
            className="border-white text-white hover:bg-white/10"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          >
            Search
          </Button>
          
          <Button
            onClick={onExport}
            variant="outline"
            size="small"
            className="border-white text-white hover:bg-white/10"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            }
          >
            Export
          </Button>
          
          <div className="hidden sm:flex space-x-2">
            <Link to={`/diary/${chat.id}`}>
              <Button
                variant="outline"
                size="small"
                className="border-white text-white hover:bg-white/10"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                }
              >
                Journal
              </Button>
            </Link>
            
            <Link to={`/analytics/${chat.id}`}>
              <Button
                variant="outline"
                size="small"
                className="border-white text-white hover:bg-white/10"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              >
                Analytics
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;