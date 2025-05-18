import { useContext } from 'react';
import { ChatContext } from '../Contexts/ChatContext';

export const useChatData = () => {
  const context = useContext(ChatContext);
  
  if (context === undefined) {
    throw new Error('useChatData must be used within a ChatProvider');
  }
  
  return context;
};

export default useChatData;