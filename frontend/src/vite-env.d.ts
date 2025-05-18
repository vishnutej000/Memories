/// <reference types="vite/client" />

// For WhatsApp message data
interface WhatsAppMessage {
  id: string;
  timestamp: Date;
  sender: string;
  content: string;
  isMedia: boolean;
  isUser: boolean;
  emojis?: string[];
  sentimentScore?: number;
}

// For React props
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}