export interface ChatFile {
  id: string;
  filename: string;
  uploaded_at: string;
  message_count: number;
  date_range: {
    start: string;
    end: string;
  };
  participants: string[];
  is_group_chat: boolean;
}

export interface ChatMetadata {
  id: string;
  participants: string[];
  owner_participant: string | null;
  first_message_date: string;
  last_message_date: string;
  message_count: number;
  is_group_chat: boolean;
  has_media: boolean;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  timestamp: string;
  date: string;
  time: string;
  sender: string;
  content: string;
  type: MessageType;
  media_url?: string;
  sentiment_score?: number;
  is_deleted?: boolean;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact' | 'system';

export interface DateRange {
  date: string;
  message_count: number;
  sentiment_avg: number;
}

export interface ChatEvent {
  id: string;
  date: string;
  type: EventType;
  description: string;
  importance: number;
}

export type EventType = 'first_message' | 'high_activity' | 'long_silence' | 'argument' | 'celebration' | 'custom';