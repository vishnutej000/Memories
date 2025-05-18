import { useState } from 'react';

export function useChatData() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  
  const parseFile = async (file: File): Promise<void> => {
    const text = await file.text();
    // Mock parse (replace with WASM later)
    const mockMessages: WhatsAppMessage[] = Array(100).fill(0).map((_, i) => ({
      id: `msg-${i}`,
      timestamp: new Date(Date.now() - i * 60000),
      sender: i % 2 === 0 ? "You" : "Friend",
      content: `Sample message ${i}`,
      isMedia: false,
      isUser: i % 2 === 0,
    }));
    setMessages(mockMessages);
  };

  return { messages, parseFile };
}