export interface DiaryEntry {
  chatId: string;
  date: string;
  text: string;
  emotion: Emotion;
  has_audio: boolean;
  audio_duration?: number;
  created_at: string;
  updated_at: string;
}

export type Emotion = 'happy' | 'sad' | 'angry' | 'neutral' | 'surprised' | 'fearful' | 'loving';

export interface DiaryAudio {
  chatId: string;
  date: string;
  blob: Blob;
  duration: number;
  created_at: string;
}