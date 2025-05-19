import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '../../types/chat.types';

interface ChatBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  onHeightChange?: (height: number) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isCurrentUser,
  onHeightChange
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Report the height of the bubble after render and after image loads
  useEffect(() => {
    if (bubbleRef.current && onHeightChange) {
      onHeightChange(bubbleRef.current.offsetHeight);
    }
  }, [onHeightChange, message.content, imageLoaded]);
  
  // Get sentiment color
  const getSentimentColor = () => {
    if (message.sentiment_score === undefined) return undefined;
    
    if (message.sentiment_score >= 0.5) return 'bg-green-100 dark:bg-green-900/20';
    if (message.sentiment_score >= 0.1) return 'bg-green-50 dark:bg-green-900/10';
    if (message.sentiment_score <= -0.5) return 'bg-red-100 dark:bg-red-900/20';
    if (message.sentiment_score <= -0.1) return 'bg-red-50 dark:bg-red-900/10';
    return undefined;
  };
  
  // Render media content
  const renderMedia = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="mb-1">
            <img
              src={message.media_url}
              alt="Image"
              className="max-w-full rounded-md max-h-60 object-contain"
              onLoad={() => {
                setImageLoaded(true);
                if (bubbleRef.current && onHeightChange) {
                  onHeightChange(bubbleRef.current.offsetHeight);
                }
              }}
            />
          </div>
        );
      case 'video':
        return (
          <div className="mb-1">
            <video 
              controls 
              className="max-w-full rounded-md max-h-60 object-contain"
              onLoadedMetadata={() => {
                if (bubbleRef.current && onHeightChange) {
                  onHeightChange(bubbleRef.current.offsetHeight);
                }
              }}
            >
              <source src={message.media_url} />
              Your browser doesn't support video playback.
            </video>
          </div>
        );
      case 'audio':
        return (
          <div className="mb-1">
            <audio 
              controls 
              className="max-w-full"
              onLoadedMetadata={() => {
                if (bubbleRef.current && onHeightChange) {
                  onHeightChange(bubbleRef.current.offsetHeight);
                }
              }}
            >
              <source src={message.media_url} />
              Your browser doesn't support audio playback.
            </audio>
          </div>
        );
      default:
        return null;
    }
  };
  
  const sentimentClass = getSentimentColor();
  
  return (
    <div
      ref={bubbleRef}
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2 px-4`}
    >
      <div
        className={`relative max-w-[80%] rounded-lg px-3 py-2 shadow
          ${isCurrentUser 
            ? `ml-10 ${sentimentClass || 'chat-bubble-outgoing'}`
            : `mr-10 ${sentimentClass || 'chat-bubble-incoming'}`}
          ${message.is_deleted ? 'italic opacity-70' : ''}`}
      >
        {!isCurrentUser && (
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
            {message.sender}
          </div>
        )}
        
        {renderMedia()}
        
        {message.is_deleted ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">This message was deleted</p>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
        
        <div className={`text-xs mt-1 ${isCurrentUser ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'} text-right`}>
          {message.time}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;