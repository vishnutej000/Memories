// API endpoint configuration
// Matched to your actual backend API endpoints
export const API_ENDPOINTS = {
  // Main endpoints
  CHATS: '/chat',                      // Get all chats
  CHAT: '/chat/:chatId',               // Get a specific chat
  CHAT_UPLOAD: '/chat/upload',         // Upload a chat file
  
  // Message-related endpoints
  MESSAGES: '/chat/:chatId/messages',
  MESSAGES_BY_DATE: '/chat/:chatId/messages/date/:date',
  SEARCH_MESSAGES: '/chat/:chatId/search',
  
  // Additional endpoints
  DATE_RANGES: '/chat/:chatId/dates',
};

// Utility function to replace URL parameters
export const getUrl = (endpoint: string, params: Record<string, string> = {}): string => {
  let url = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  return url;
};