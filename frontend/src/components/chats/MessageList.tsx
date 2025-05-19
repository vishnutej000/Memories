import React from 'react';
import { ChatMessage } from '../../types/chat.types';
import MessageBubble from './ChatBubble';

interface MessageListProps {
  messages: ChatMessage[];
  ownerName: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, ownerName }) => {
  // Group messages by sender for consecutive messages
  const groupedMessages: ChatMessage[][] = [];
  let currentGroup: ChatMessage[] = [];
  let currentSender = '';
  
  messages.forEach(message => {
    if (message.sender !== currentSender) {
      if (currentGroup.length > 0) {
        groupedMessages.push(currentGroup);
      }
      currentGroup = [message];
      currentSender = message.sender;
    } else {
      currentGroup.push(message);
    }
  });
  
  if (currentGroup.length > 0) {
    groupedMessages.push(currentGroup);
  }
  
  return (
    <div className="space-y-4 py-2">
      {groupedMessages.map((group, groupIndex) => {
        const isOwner = group[0].sender === ownerName;
        
        return (
          <div 
            key={groupIndex} 
            className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] space-y-1`}>
              {group.map((message, messageIndex) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  isOwner={isOwner}
                  showSender={messageIndex === 0}
                  showTimestamp={messageIndex === group.length - 1}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;