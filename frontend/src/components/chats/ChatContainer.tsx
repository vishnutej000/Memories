import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../../hooks/usechat';
import { ChatMessage } from '../../types/chat.types';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import DateNavigator from './DateNavigator';
import EmptyState from '../common/EmptyState';
import LoadingScreen from '../common/LoadingScreen';
import ErrorMessage from '../common/ErrorMessage';
import { format } from 'date-fns';

const ChatContainer: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { 
    messages, 
    metadata, 
    dateRanges, 
    loading, 
    error, 
    fetchMessagesByDate 
  } = useChat(chatId);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Load initial messages when component mounts
  useEffect(() => {
    if (chatId && metadata && !selectedDate) {
      // Start with the most recent date
      setSelectedDate(metadata.last_message_date);
    }
  }, [chatId, metadata, selectedDate]);
  
  // Fetch messages when selected date changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId || !selectedDate) return;
      
      setLoadingMessages(true);
      try {
        await fetchMessagesByDate(selectedDate);
      } catch (err) {
        console.error('Error loading messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    };
    
    loadMessages();
  }, [chatId, selectedDate, fetchMessagesByDate]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageEndRef.current && !loadingMessages) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMessages]);
  
  // Handle date selection
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };
  
  // Handle back navigation
  const handleBack = () => {
    navigate('/');
  };
  
  if (loading && !messages.length) {
    return <LoadingScreen message="Loading conversation..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }
  
  if (!metadata) {
    return <EmptyState message="Chat not found" action={{ label: 'Go Home', onClick: handleBack }} />;
  }
  
  return (
    <div className="h-full flex flex-col">
      <ChatHeader 
        title={metadata.is_group_chat 
          ? metadata.participants.find(p => p !== metadata.owner_participant) || 'Group Chat'
          : metadata.participants.filter(p => p !== metadata.owner_participant).join(', ')}
        messageCount={metadata.message_count}
        dateRange={{
          start: metadata.first_message_date,
          end: metadata.last_message_date
        }}
        onBack={handleBack}
      />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <DateNavigator
          dates={dateRanges}
          selectedDate={selectedDate}
          onSelectDate={handleDateChange}
        />
        
        <div className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50 dark:bg-gray-900">
          {loadingMessages ? (
            <div className="h-full flex items-center justify-center">
              <LoadingScreen message={`Loading messages from ${format(new Date(selectedDate), 'MMM d, yyyy')}`} />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState 
                message={`No messages found for ${format(new Date(selectedDate), 'MMM d, yyyy')}`} 
                description="Try selecting a different date from the calendar."
              />
            </div>
          ) : (
            <>
              <MessageList 
                messages={messages} 
                ownerName={metadata.owner_participant} 
              />
              <div ref={messageEndRef} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;