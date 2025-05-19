import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatContainer from '../components/chat/ChatContainer';
import SearchBox from '../components/chat/SearchBox';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorMessage from '../components/common/ErrorMessage';
import { useChat } from '../hooks/useChat';

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { metadata, loading, error } = useChat(chatId);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  // Clear selected date when changing chats
  useEffect(() => {
    setSelectedDate(undefined);
  }, [chatId]);

  if (!chatId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            No chat selected
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Please select a chat from the sidebar or upload a new chat.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !metadata) {
    return <LoadingScreen message="Loading chat data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-white dark:bg-gray-800 shadow rounded-lg mb-4">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          {metadata?.is_group_chat 
            ? 'Group Chat' 
            : metadata?.participants.filter(p => p !== metadata.owner_participant).join(', ')}
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {metadata?.message_count} messages · 
          {metadata?.participants.length} participants · 
          From {metadata?.first_message_date} to {metadata?.last_message_date}
        </div>
        
        <div className="mt-4">
          <SearchBox chatId={chatId} />
        </div>
      </div>
      
      <div className="flex-1 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <ChatContainer 
          chatId={chatId} 
          selectedDate={selectedDate} 
        />
      </div>
    </div>
  );
};

export default ChatPage;