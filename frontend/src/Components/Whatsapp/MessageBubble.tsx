import React, { useState } from 'react';
import { ChatMessage } from '../../types';
import { formatTime } from '../../utils/dateUtils';
import { getSentimentEmoji } from '../../utils/messageUtils';
import ContextMenu from './ContextMenu';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showSentiment?: boolean;
  isFocused?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showSentiment = false,
  isFocused = false
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  
  // Handle right click (context menu)
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };
  
  // Handle rendering message content
  const renderContent = () => {
    // Handle deleted messages
    if (message.isDeleted) {
      return (
        <div className="italic text-gray-500 dark:text-gray-400">
          This message was deleted
        </div>
      );
    }
    
    // Handle media messages
    if (message.isMedia) {
      return (
        <div className="flex items-center text-gray-700 dark:text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Media
        </div>
      );
    }
    
    // Handle normal messages - detect URLs and format them as links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.content.split(urlRegex);
    
    return (
      <div className="whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (part.match(urlRegex)) {
            return (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline"
              >
                {part}
              </a>
            );
          }
          return part;
        })}
      </div>
    );
  };
  
  // Context menu items
  const contextMenuItems = [
    {
      label: 'Copy Text',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
      ),
      onClick: () => {
        navigator.clipboard.writeText(message.content);
      },
      disabled: message.isDeleted || message.isMedia
    },
    {
      label: 'Copy Timestamp',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => {
        navigator.clipboard.writeText(message.timestamp);
      }
    }
  ];
  
  return (
    <div
      className={`
        flex ${isOwnMessage ? 'justify-end' : 'justify-start'}
        ${isFocused ? 'animate-pulse' : ''}
      `}
      onContextMenu={handleContextMenu}
    >
      <div
        className={`
          chat-bubble max-w-[75%] py-2 px-3 rounded-lg shadow-message
          ${isOwnMessage ? 'own-message rounded-tr-none' : 'other-message rounded-tl-none'}
          ${isFocused ? 'ring-2 ring-whatsapp-light dark:ring-whatsapp-dark' : ''}
        `}
      >
        {/* Sender name (for group chats) */}
        {!isOwnMessage && (
          <div className="text-xs font-medium text-whatsapp-dark dark:text-whatsapp-light mb-1">
            {message.sender}
          </div>
        )}
        
        {/* Message content */}
        <div className="mb-1">
          {renderContent()}
        </div>
        
        {/* Timestamp and sentiment */}
        <div className="flex items-center justify-end text-xs text-gray-500 dark:text-gray-400">
          {showSentiment && typeof message.sentimentScore === 'number' && (
            <span className="mr-1" title={`Sentiment: ${message.sentimentScore.toFixed(2)}`}>
              {getSentimentEmoji(message.sentimentScore)}
            </span>
          )}
          <span>{formatTime(message.timestamp)}</span>
        </div>
      </div>
      
      {/* Context menu */}
      {showContextMenu && (
        <ContextMenu
          items={contextMenuItems}
          xPos={contextMenuPosition.x}
          yPos={contextMenuPosition.y}
          onClose={() => setShowContextMenu(false)}
        />
      )}
    </div>
  );
};

export default MessageBubble;