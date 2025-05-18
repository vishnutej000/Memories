import React, { useEffect, useState, useRef, useCallback, Fragment } from 'react';
import { useVirtualScroll } from '../../hooks/useVirtualScroll';
import { useChatData } from '../../hooks/useChatData';
import MessageBubble from '../ChatInterface/MessageBubble';
import DateSeparator from '../ChatInterface/DateSeparator';
import ChatInput from '../ChatInterface/ChatInput';
import { Message } from '../../lib/parser';

interface ChatViewProps {
  onImportClick: () => void; // Function to show the import modal
}

const ChatView: React.FC<ChatViewProps> = ({ onImportClick }) => {
  const { 
    messages, 
    userIdentity, 
    addMessage, 
    loading, 
    error 
  } = useChatData();
  
  const [dateHeadersMap, setDateHeadersMap] = useState<Map<string, boolean>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  
  // Group messages by date for date separators
  useEffect(() => {
    const newDateHeaders = new Map<string, boolean>();
    
    messages.forEach((message: { timestamp: string | number | Date; }) => {
      const date = new Date(message.timestamp);
      const dateKey = date.toDateString();
      
      if (!newDateHeaders.has(dateKey)) {
        newDateHeaders.set(dateKey, true);
      }
    });
    
    setDateHeadersMap(newDateHeaders);
  }, [messages]);
  
  const getItemKey = useCallback((index: number, data: Message[]) => {
    return data[index].id;
  }, []);
  
  // Virtual scroll setup
  const { 
    virtualItems, 
    totalHeight, 
    startIndex, 
    endIndex 
  } = useVirtualScroll({
    itemCount: messages.length,
    estimatedItemHeight: 70,
    overscan: 10,
    getItemHeight: (index: number) => {
      const message = messages[index];
      const date = new Date(message.timestamp);
      const dateKey = date.toDateString();
      
      // Check if this message should have a date header
      let isFirstMessageOfDate = false;
      if (index === 0) {
        isFirstMessageOfDate = true;
      } else {
        const prevMessage = messages[index - 1];
        const prevDate = new Date(prevMessage.timestamp);
        if (prevDate.toDateString() !== dateKey) {
          isFirstMessageOfDate = true;
        }
      }
      
      // Estimate height: base message height + optional date separator
      return isFirstMessageOfDate ? 100 : 70;
    }
  });
  
  // Auto-scroll to bottom on new messages when appropriate
  useEffect(() => {
    if (loading || !scrollContainerRef.current) return;
    
    if (shouldAutoScrollRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);
  
  // Handle scroll and set auto-scroll behavior
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    shouldAutoScrollRef.current = isNearBottom;
  };
  
  const handleSendMessage = (content: string, type: 'text' | 'audio') => {
    if (!userIdentity) return;
    
    const newMessage: Message = {
      id: `new-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sender: userIdentity,
      content,
      type,
    };
    
    addMessage(newMessage);
    shouldAutoScrollRef.current = true;
  };
  
  const renderMessageWithDateSeparator = (message: Message, index: number) => {
    const date = new Date(message.timestamp);
    const dateKey = date.toDateString();
    
    // Check if this message should have a date header
    let isFirstMessageOfDate = false;
    if (index === 0) {
      isFirstMessageOfDate = true;
    } else {
      const prevMessage = messages[index - 1];
      const prevDate = new Date(prevMessage.timestamp);
      if (prevDate.toDateString() !== dateKey) {
        isFirstMessageOfDate = true;
      }
    }
    
    return (
      <Fragment key={message.id}>
        {isFirstMessageOfDate && (
          <DateSeparator 
            date={date} 
            sentiment={{
              score: Math.random() * 2 - 1, // Mock sentiment score between -1 and 1
              label: Math.random() > 0.6 ? 'positive' : Math.random() > 0.3 ? 'neutral' : 'negative'
            }}
          />
        )}
        <MessageBubble 
          message={message} 
          isOwnMessage={message.sender === userIdentity} 
        />
      </Fragment>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-whatsapp-teal mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading your messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900">Error Loading Messages</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-whatsapp-teal text-white rounded-lg shadow hover:bg-opacity-90"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-whatsapp-teal text-4xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-900">No Messages Yet</h3>
            <p className="mt-2 text-gray-600">
              Import your WhatsApp chat export to see your messages here.
            </p>
            <button 
              className="mt-4 px-4 py-2 bg-whatsapp-teal text-white rounded-lg shadow hover:bg-opacity-90"
              onClick={onImportClick} // Use the passed function to open import modal
            >
              Import Chat
            </button>
          </div>
        </div>
        <ChatInput 
          onSendMessage={handleSendMessage}
          onAttachMedia={() => {/* Open media modal */}}
          disabled={!userIdentity}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-whatsapp-bg overflow-hidden">
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto" 
        style={{ position: 'relative' }}
      >
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
          {virtualItems.map((virtualItem) => {
            const message = messages[virtualItem.index];
            return (
              <div
                key={message.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                  padding: '0 16px',
                }}
              >
                {renderMessageWithDateSeparator(message, virtualItem.index)}
              </div>
            );
          })}
        </div>
      </div>
      
      <ChatInput 
        onSendMessage={handleSendMessage}
        onAttachMedia={onImportClick} // Also use it here for media attachment
      />
    </div>
  );
};

export default ChatView;