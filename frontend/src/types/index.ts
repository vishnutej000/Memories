// Core Types for WhatsApp Memory Vault

// WhatsApp Chat Data
export interface WhatsAppChat {
  id: string;
  name: string;
  participants: string[];
  messages: ChatMessage[];
  isGroup: boolean;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  messageCount: number;
  metadata?: {
    totalEmojis?: number;
    sentimentAverage?: number;
    topWords?: { word: string; count: number }[];
    [key: string]: any;
  };
}

// Individual Chat Message
export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string; // ISO date string
  isMedia: boolean;
  isDeleted?: boolean;
  isForwarded?: boolean;
  emojiCount?: number;
  sentimentScore?: number; // -1 to 1
  [key: string]: any;
}

// Journal Entry
export interface JournalEntry {
  id: string;
  chatId: string;
  date: string; // ISO date string
  text: string;
  emotion: Emotion;
  audioNoteUrl?: string;
  audioDuration?: number; // in seconds
  tags: string[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Emotion Type
export interface Emotion {
  primary: 'happy' | 'sad' | 'angry' | 'surprised' | 'fearful' | 'disgusted' | 'loving' | 'neutral';
  intensity: 1 | 2 | 3 | 4 | 5; // 1=very low, 5=very high
}

// Search Criteria
export interface SearchCriteria {
  chatId: string;
  query?: string;
  sender?: string;
  dateRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  hasMedia?: boolean;
  hasEmoji?: boolean;
  sentimentRange?: {
    min?: number; // -1 to 1
    max?: number; // -1 to 1
  };
}

// Export Options
export interface ExportOptions {
  chatId: string;
  format: 'pdf' | 'html' | 'txt' | 'zip';
  includeMedia?: boolean;
  dateRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  includeJournalEntries?: boolean;
  redactedMode?: boolean;
  redactedSenders?: string[];
  theme?: 'light' | 'dark';
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Audio Recorder Options
export interface AudioRecorderOptions {
  maxDurationSeconds?: number;
  onRecordingComplete?: (blob: Blob, duration: number) => void;
}

// Upload Response
export interface UploadResponse {
  url: string;
  filename: string;
  filesize: number;
}

// Theme settings
export interface ThemeSettings {
  darkMode: boolean;
  accentColor: 'teal' | 'blue' | 'green' | 'purple' | 'orange';
  fontSize: 'small' | 'medium' | 'large';
}

// User settings
export interface UserSettings {
  username: string;
  theme: ThemeSettings;
  notifications: {
    enabled: boolean;
    notifyOnExport: boolean;
    notifyOnError: boolean;
  };
  privacy: {
    usePin: boolean;
    autoLockAfterMinutes: number | null;
    hideLastSeen: boolean;
  };
  storage: {
    autoBackup: boolean;
    autoBackupIntervalDays: number;
    lastBackupDate: string | null;
  };
}

// Storage item with metadata
export interface StorageItem<T> {
  data: T;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// Chart data types
export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

// Search result with context
export interface SearchResultWithContext {
  message: ChatMessage;
  context?: {
    before: ChatMessage[];
    after: ChatMessage[];
  };
  matchIndexes?: number[];
}