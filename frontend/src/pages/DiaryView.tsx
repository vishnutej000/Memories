import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getChat } from '../services/storageServices';
import { getJournalEntryForDate, createOrUpdateJournalEntry } from '../services/storageServices';
import { WhatsAppChat, JournalEntry, Emotion, ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { formatDisplayDate, formatCalendarDate } from '../utils/dateUtils';
import { getHighActivityDays } from '../utils/messageUtils';

import Button from '../Components/UI/Button';
import Spinner from '../Components/UI/Spinner';
import DatePicker from '../Components/UI/DatePicker';
import JournalEntryComponent from '../Components/Dairy/JournalEntry';
import DailyInsight from '../Components/Dairy/DailyInsight';
import EmotionPicker from '../Components/Dairy/EmotionPicker';
import AudioRecorder from '../Components/Dairy/AudioRecorder';
import DailyReminder from '../Components/Diary/DailyReminder';

const DiaryView: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  
  // State
  const [chat, setChat] = useState<WhatsAppChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [messagesForDate, setMessagesForDate] = useState<ChatMessage[]>([]);
  const [keyEventDates, setKeyEventDates] = useState<Set<string>>(new Set());
  
  const [journalEntry, setJournalEntry] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form fields state for editing
  const [entryText, setEntryText] = useState('');
  const [entryEmotion, setEntryEmotion] = useState<Emotion>({
    primary: 'neutral',
    intensity: 3
  });
  const [entryTags, setEntryTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [audioNoteUrl, setAudioNoteUrl] = useState('');
  const [audioDuration, setAudioDuration] = useState(0);
  
  // Load chat and journal entry
  useEffect(() => {
    const loadData = async () => {
      if (!chatId) {
        navigate('/404');
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Load chat
        const chatData = await getChat(chatId);
        setChat(chatData);
        
        // Find high activity days
        const keyDates = getHighActivityDays(chatData.messages, 0.9);
        setKeyEventDates(new Set(keyDates));
        
        // Find messages for the selected date
        filterMessagesForDate(chatData.messages, selectedDate);
        
        // Load journal entry for the selected date
        const entry = await getJournalEntryForDate(chatId, selectedDate);
        setJournalEntry(entry || null);
        
        // If entry exists, populate form fields
        if (entry) {
          setEntryText(entry.text);
          setEntryEmotion(entry.emotion);
          setEntryTags(entry.tags);
          setAudioNoteUrl(entry.audioNoteUrl || '');
          setAudioDuration(entry.audioDuration || 0);
        } else {
          resetForm();
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [chatId, navigate, selectedDate]);
  
  // Filter messages for the selected date
  const filterMessagesForDate = (messages: ChatMessage[], date: string) => {
    const filtered = messages.filter(message => {
      const messageDate = new Date(message.timestamp).toISOString().split('T')[0];
      return messageDate === date;
    });
    
    setMessagesForDate(filtered);
  };
  
  // Reset form fields
  const resetForm = () => {
    setEntryText('');
    setEntryEmotion({
      primary: 'neutral',
      intensity: 3
    });
    setEntryTags([]);
    setTagInput('');
    setAudioNoteUrl('');
    setAudioDuration(0);
  };
  
  // Handle date change
  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
  };
  
  // Start editing
  const handleStartEditing = () => {
    if (journalEntry) {
      // Edit existing entry (form fields are already populated)
      setIsEditing(true);
    } else {
      // Create new entry
      resetForm();
      setIsEditing(true);
    }
  };
  
  // Cancel editing
  const handleCancelEditing = () => {
    setIsEditing(false);
    
    // Reset form to original entry data or empty if no entry
    if (journalEntry) {
      setEntryText(journalEntry.text);
      setEntryEmotion(journalEntry.emotion);
      setEntryTags(journalEntry.tags);
      setAudioNoteUrl(journalEntry.audioNoteUrl || '');
      setAudioDuration(journalEntry.audioDuration || 0);
    } else {
      resetForm();
    }
  };
  
  // Save journal entry
  const handleSaveEntry = async () => {
    if (!chatId) return;
    
    try {
      setIsSaving(true);
      
      // Prepare entry data
      const entryData: JournalEntry = {
        id: journalEntry?.id || uuidv4(),
        chatId,
        date: selectedDate,
        text: entryText,
        emotion: entryEmotion,
        tags: entryTags,
        createdAt: journalEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add audio note if present
      if (audioNoteUrl) {
        entryData.audioNoteUrl = audioNoteUrl;
        entryData.audioDuration = audioDuration;
      }
      
      // Save entry
      const savedEntry = await createOrUpdateJournalEntry(entryData);
      
      // Update state
      setJournalEntry(savedEntry);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving journal entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to save journal entry');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle tag input
  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    
    if (tag && !entryTags.includes(tag)) {
      setEntryTags([...entryTags, tag]);
    }
    
    setTagInput('');
  };
  
  // Handle tag removal
  const handleRemoveTag = (tag: string) => {
    setEntryTags(entryTags.filter(t => t !== tag));
  };
  
  // Handle audio recording complete
  const handleAudioRecordingComplete = (url: string, duration: number) => {
    setAudioNoteUrl(url);
    setAudioDuration(duration);
  };
  
  // Get last journal entry date
  const lastJournalEntry = useMemo(() => {
    if (!chat?.messages.length) return undefined;
    const journalEntries = chat.messages.filter(msg => msg.isJournalEntry);
    if (!journalEntries.length) return undefined;
    return journalEntries[journalEntries.length - 1].timestamp;
  }, [chat?.messages]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Spinner size="large" text="Loading diary..." />
      </div>
    );
  }
  
  // Render error state
  if (error || !chat) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Failed to load diary</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Chat not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-whatsapp-dark hover:bg-whatsapp-teal text-white py-2 px-4 rounded-lg font-medium"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Diary Mode
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Transform your chat into a personal journal
        </p>
      </div>

      {/* Daily Reminder */}
      <div className="mb-8">
        <DailyReminder
          onStartJournaling={() => {
            // Implement journaling start functionality
            console.log('Start journaling');
          }}
          lastJournalEntry={lastJournalEntry}
        />
      </div>

      {/* Existing diary content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Date picker column */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Choose a Date
            </h2>
            
            <DatePicker
              startDate={chat.startDate}
              endDate={chat.endDate}
              onSelectDate={handleDateChange}
              highlightDates={Array.from(keyEventDates)}
              selectedDate={selectedDate}
            />
          </div>
        </div>
        
        {/* Main content column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Journal entry section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white">
                Journal for {formatCalendarDate(selectedDate)}
              </h2>
              
              {!isEditing && (
                <Button
                  onClick={handleStartEditing}
                  variant="primary"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  }
                >
                  {journalEntry ? 'Edit Entry' : 'New Entry'}
                </Button>
              )}
            </div>
            
            {isEditing ? (
              // Edit mode
              <div className="space-y-6">
                {/* Emotion picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    How were you feeling on this day?
                  </label>
                  <EmotionPicker
                    emotion={entryEmotion}
                    onChange={setEntryEmotion}
                  />
                </div>
                
                {/* Journal text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Journal Entry
                  </label>
                  <textarea
                    value={entryText}
                    onChange={(e) => setEntryText(e.target.value)}
                    className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-whatsapp-dark focus:border-whatsapp-dark dark:bg-gray-700 dark:text-white"
                    placeholder="Write your thoughts about this day..."
                  ></textarea>
                </div>
                
                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    {entryTags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-whatsapp-light/10 text-whatsapp-dark dark:bg-whatsapp-dark/20 dark:text-whatsapp-light"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1.5 inline-flex items-center justify-center rounded-full h-4 w-4 hover:bg-black/10 dark:hover:bg-white/10"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-whatsapp-dark focus:border-whatsapp-dark dark:bg-gray-700 dark:text-white"
                      placeholder="Add tag and press Enter"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-2 bg-whatsapp-dark text-white rounded-r-md hover:bg-whatsapp-teal"
                    >
                      Add
                    </button>
                  </div>
                </div>
                
                {/* Audio recorder */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Audio Note
                  </label>                    <AudioRecorder
                    onRecordingComplete={handleAudioRecordingComplete}
                    chatId={chatId || ''}
                    date={selectedDate}
                    initialAudioUrl={audioNoteUrl}
                    initialAudioDuration={audioDuration}
                  />
                </div>
                
                {/* Action buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={handleCancelEditing}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={handleSaveEntry}
                    disabled={isSaving || entryText.trim().length === 0}
                    variant="primary"
                    icon={isSaving ? <Spinner size="small" color="white" /> : undefined}
                  >
                    {isSaving ? 'Saving...' : 'Save Entry'}
                  </Button>
                </div>
              </div>
            ) : journalEntry ? (
              // View mode with entry
              <JournalEntryComponent
                entry={journalEntry}
                onEdit={handleStartEditing}
              />
            ) : (
              // Empty state
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                  No journal entry for this date
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create a new entry to record your thoughts about this day.
                </p>
                <Button
                  onClick={handleStartEditing}
                  variant="primary"
                >
                  Create New Entry
                </Button>
              </div>
            )}
          </div>
          
          {/* Daily insights section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Daily Insight
            </h2>
            
            <DailyInsight
              messages={messagesForDate}
              date={selectedDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryView;