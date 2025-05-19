import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useChat } from '../../hooks/usechat';
import { format, parseISO } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';

const Sidebar: React.FC = () => {
  const { activeChats, isLoading, error, fetchChats } = useChat();
  const navigate = useNavigate();
  
  // Only call fetchChats if it's available
  useEffect(() => {
    if (typeof fetchChats === 'function') {
      try {
        fetchChats();
      } catch (err) {
        console.error("Error fetching chats in Sidebar:", err);
      }
    }
  }, [fetchChats]);
  
  // Safe check for date formatting
  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateString || 'Unknown date';
    }
  };
  
  // Safely get participants string
  const getParticipantsString = (chat: any): string => {
    if (!chat) return '';
    
    try {
      if (chat.is_group_chat) {
        return chat.filename || 'Group Chat';
      }
      
      if (chat.participants && Array.isArray(chat.participants)) {
        const filteredParticipants = chat.participants.filter((p: string) => p !== 'You');
        return filteredParticipants.length > 0 
          ? filteredParticipants.join(', ') 
          : chat.filename || 'Chat';
      }
      
      return chat.filename || 'Chat';
    } catch (error) {
      console.error("Error processing participants:", error);
      return chat.filename || 'Chat';
    }
  };
  
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Link
          to="/upload"
          className="w-full flex justify-center items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
        >
          Upload Chat
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Your Chats
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center p-4">
            <LoadingSpinner size="sm" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 p-2">
            {error}
          </div>
        ) : (!activeChats || activeChats.length === 0) ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 p-2">
            No chats found. Upload a chat to get started.
          </div>
        ) : (
          <ul className="space-y-2">
            {activeChats.map(chat => (
              <li key={chat.id}>
                <Link
                  to={`/chat/${chat.id}`}
                  className="block p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="font-medium text-gray-700 dark:text-gray-200 truncate">
                    {getParticipantsString(chat)}
                  </div>
                  {chat.date_range && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {chat.message_count || 0} messages · Last active {
                        formatDate(chat.date_range.end)
                      }
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;