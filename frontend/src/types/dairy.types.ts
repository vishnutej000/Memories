export interface DiaryEntry {
  id: string;
  chatId: string;
  date: string;
  content: string;
  audioUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveDiaryEntryRequest {
  date: string;
  content: string;
}

export interface SearchDiaryEntriesResponse {
  entries: DiaryEntry[];
  total: number;
}   