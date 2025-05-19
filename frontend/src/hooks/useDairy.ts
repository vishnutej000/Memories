import { useState, useEffect, useCallback } from 'react';
import { DiaryService } from '../api/dairy.service';
import { DiaryEntry, Emotion } from '../types/dairy.types';
import { useIndexedDB } from './useIndexedDB';

export const useDiary = (chatId: string, date: string) => {
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const db = useIndexedDB();
  
  // Load diary entry
  useEffect(() => {
    const loadDiaryEntry = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to get from IndexedDB first
        const cachedEntry = await db.getFromIndex<DiaryEntry>(
          'diary_entries', 
          'by_chat_date', 
          [chatId, date]
        );
        
        if (cachedEntry) {
          setEntry(cachedEntry);
        } else {
          // If not in local storage, try to get from API
          const apiEntry = await DiaryService.getDiaryEntry(chatId, date);
          
          if (apiEntry) {
            setEntry(apiEntry);
            // Cache in IndexedDB
            await db.put('diary_entries', apiEntry);
          }
        }
      } catch (err: any) {
        console.error('Error loading diary entry:', err);
        setError(err.message || 'Failed to load diary entry');
      } finally {
        setLoading(false);
      }
    };
    
    loadDiaryEntry();
  }, [chatId, date, db]);
  
  // Save diary entry
  const saveEntry = useCallback(async (
    text: string, 
    emotion: Emotion, 
    hasAudio: boolean,
    audioDuration?: number
  ) => {
    try {
      setSaving(true);
      setError(null);
      
      const entryData = {
        text,
        emotion,
        has_audio: hasAudio,
        audio_duration: audioDuration
      };
      
      const savedEntry = await DiaryService.saveDiaryEntry(
        chatId, 
        date, 
        entryData
      );
      
      setEntry(savedEntry);
      
      // Update cache
      await db.put('diary_entries', savedEntry);
      
      return savedEntry;
    } catch (err: any) {
      console.error('Error saving diary entry:', err);
      setError(err.message || 'Failed to save diary entry');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [chatId, date, db]);
  
  // Delete diary entry
  const deleteEntry = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      
      await DiaryService.deleteDiaryEntry(chatId, date);
      
      setEntry(null);
      
      // Remove from cache
      await db.deleteItem('diary_entries', [chatId, date]);
    } catch (err: any) {
      console.error('Error deleting diary entry:', err);
      setError(err.message || 'Failed to delete diary entry');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [chatId, date, db]);
  
  return {
    entry,
    loading,
    saving,
    error,
    saveEntry,
    deleteEntry
  };
};