import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ChatMessage } from '../../types';
import { groupMessagesByDate } from '../../utils/messageUtils';
import { formatDate } from '../../utils/date.Utils';
import MessageBubble from './MessageBubble';
import VirtualScrollView from '../UI/VirtualScrollView';

interface MessageListProps {
  messages: ChatMessage[];
  currentUser: string;
  showSentiment?: boolean;
  keyEventDates?: Set<string>;
}

export interface MessageListRef {
  scrollToMessage: (messageId: string) => void;
  scrollToDate: (date: string) => void;
}

const MessageList = forwardRef<MessageListRef, MessageListProps>(
  ({ messages, currentUser, showSentiment = false, keyEventDates }, ref) => {
    const [groupedMessages, setGroupedMessages] = useState<Record<string, ChatMessage[]>>({});
    const [allDates, setAllDates] = useState<string[]>([]);
    const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
    
    const virtualScrollRef = React.useRef<any>(null);
    
    // Group messages by date when messages change
    useEffect(() => {
      const grouped = groupMessagesByDate(messages);
      setGroupedMessages(grouped);
      
      // Extract and sort dates
      const dates = Object.keys(grouped).sort();
      setAllDates(dates);
    }, [messages]);
    
    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      scrollToMessage: (messageId: string) => {
        // Find the message and scroll to it
        const message = messages.find(msg => msg.id === messageId);
        if (message) {
          // Get date of message
          const date = new Date(message.timestamp).toISOString().split('T')[0];
          
          // First scroll to the date
          scrollToDate(date);
          
          // Then focus the message
          setFocusedMessageId(messageId);
          
          // Clear focus after a delay
          setTimeout(() => {
            setFocusedMessageId(null);
          }, 5000);
        }
      },
      scrollToDate: (date: string) => {
        scrollToDate(date);
      }
    }));
    
    // Scroll to a specific date
    const scrollToDate = (date: string) => {
      // Find date index
      const dateIndex = allDates.findIndex(d => d === date);
      if (dateIndex !== -1 && virtualScrollRef.current) {
        virtualScrollRef.current.scrollToItem(dateIndex);
      }
    };
    
    // Render date divider
    const renderDateDivider = (date: string) => {
      const isKeyDate = keyEventDates?.has(date);
      
      return (
        <div className="flex justify-center my-4 relative z-10">
          <div className={`
            px-4 py-1 rounded-full text-sm font-medium
            ${isKeyDate 
              ? 'bg-whatsapp-light/20 dark:bg-whatsapp-dark/30 text-whatsapp-dark dark:text-whatsapp-light border border-whatsapp-light/50 dark:border-whatsapp-dark/50' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}
          `}>
            {formatDate(date)}
            {isKeyDate && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-whatsapp-dark text-white dark:bg-whatsapp-light dark:text-gray-900">
                High Activity
              </span>
            )}
          </div>
        </div>
      );
    };
    
    // Render a group of messages for one date
    const renderDateGroup = (date: string) => {
      const messagesForDate = groupedMessages[date] || [];
      
      return (
        <div key={date} className="space-y-2 px-4">
          {renderDateDivider(date)}
          
          {messagesForDate.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.sender === currentUser}
              showSentiment={showSentiment}
              isFocused={message.id === focusedMessageId}
            />
          ))}
        </div>
      );
    };
    
    return (
      <div className="flex-1 overflow-hidden bg-whatsapp-background dark:bg-gray-900">
        {allDates.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 dark:text-gray-400">No messages to display</div>
          </div>
        ) : (
          <VirtualScrollView
            ref={virtualScrollRef}
            className="h-full p-4"
            items={allDates}
            estimatedItemHeight={400} // Rough estimate, will be adjusted based on actual content
            renderItem={date => renderDateGroup(date)}
            overscan={2}
          />
        )}
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';

export default MessageList;