import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useChat } from '../../hooks/usechat';
import { format, parseISO } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';

const Sidebar: React.FC = () => {
  const { activeChats, fetchChats, isLoading, error } = useChat();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);
  
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
                    {chat.is_group_chat 
                      ? chat.filename 
                      : chat.participants.filter(p => p !== 'You').join(', ') || chat.filename}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {chat.message_count} messages · Last active {format(parseISO(chat.date_range.end), 'MMM d, yyyy')}
                  </div>
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