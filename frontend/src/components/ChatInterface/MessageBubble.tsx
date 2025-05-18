import React from 'react';
import { Message } from '../../lib/parser';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div 
      className={`flex mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${message.id}`}
    >
      <div 
        className={`
          relative max-w-[70%] px-3 py-2 rounded-lg 
          ${isOwnMessage ? 'bg-whatsapp-green-light text-slate-800' : 'bg-white text-slate-800'}
          shadow-sm
        `}
      >
        {!isOwnMessage && <p className="text-xs font-medium text-whatsapp-teal mb-1">{message.sender}</p>}
        
        {message.type === 'text' && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
        
        {message.type === 'media' && (
          <div className="mb-1">
            <div className="bg-gray-200 h-48 flex items-center justify-center rounded">
              <p className="text-gray-500 text-sm">{message.content || 'Media attachment'}</p>
            </div>
          </div>
        )}

        <span className="text-[0.65rem] text-gray-500 float-right ml-2 mt-1">
          {formattedTime}
          {isOwnMessage && (
            <span className="ml-1 text-whatsapp-blue">
              ✓✓
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;