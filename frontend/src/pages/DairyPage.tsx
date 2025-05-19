import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { BsArrowLeft, BsPencilSquare, BsCalendar3, BsMic, BsSearch } from 'react-icons/bs';
import { useChat } from '../hooks/useChat';
import { useDiary } from '../hooks/useDairy';
import DiaryEditor from '../components/Dairy/DairyEditor';
import VoiceRecorder from '../components/Dairy/VoiceRecorder';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorMessage from '../components/common/ErrorMessage';
import DateNavigator from '../components/chats/DateNavigator';
import EmptyState from '../components/common/EmptyState';

interface DiaryEntry {
  id: string;
  chatId: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  audioUrl?: string;
}

const DiaryPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { metadata, dateRanges, loading: chatLoading, error: chatError } = useChat(chatId);
  const { 
    entries, 
    fetchEntry, 
    saveEntry, 
    saveAudio, 
    loading: diaryLoading, 
    error: diaryError 
  } = useDiary(chatId);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentEntry, setCurrentEntry] = useState<DiaryEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load initial data when component mounts
  useEffect(() => {
    if (chatId && metadata && !selectedDate) {
      // Start with the most recent date
      setSelectedDate(metadata.last_message_date);
    }
  }, [chatId, metadata, selectedDate]);

  // Fetch diary entry when selected date changes
  useEffect(() => {
    const loadEntry = async () => {
      if (!chatId || !selectedDate) return;
      
      const entry = await fetchEntry(selectedDate);
      setCurrentEntry(entry);
    };
    
    loadEntry();
  }, [chatId, selectedDate, fetchEntry]);

  // Handle date selection
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setIsEditing(false);
    setIsRecording(false);
  };

  // Handle saving diary entry
  const handleSaveEntry = async (content: string) => {
    if (!chatId || !selectedDate) return;
    
    try {
      const savedEntry = await saveEntry(selectedDate, content);
      setCurrentEntry(savedEntry);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  // Handle saving audio recording
  const handleSaveAudio = async (audioBlob: Blob) => {
    if (!chatId || !selectedDate) return;
    
    try {
      const savedEntry = await saveAudio(selectedDate, audioBlob);
      setCurrentEntry(savedEntry);
      setIsRecording(false);
    } catch (error) {
      console.error('Error saving audio:', error);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
  };

  // Loading state
  if ((chatLoading || diaryLoading) && !currentEntry) {
    return <LoadingScreen message="Loading diary..." />;
  }

  // Error state
  if (chatError || diaryError) {
    return <ErrorMessage message={chatError || diaryError || 'An error occurred'} />;
  }

  // No metadata state
  if (!metadata) {
    return (
      <EmptyState 
        message="Chat not found" 
        action={{ 
          label: 'Go Back',
          onClick: () => window.history.back()
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center">
        <Link
          to={`/chat/${chatId}`}
          className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        >
          <BsArrowLeft className="text-xl" />
        </Link>
        
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
            Diary for {metadata.is_group_chat 
              ? metadata.participants.find(p => p !== metadata.owner_participant) || 'Group Chat'
              : metadata.participants.filter(p => p !== metadata.owner_participant).join(', ')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your personal reflections, thoughts and notes
          </p>
        </div>
        
        <form onSubmit={handleSearch} className="relative max-w-xs mr-2">
          <input 
            type="text" 
            placeholder="Search diary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        </form>
      </div>

      {/* Date Navigation */}
      <DateNavigator
        dates={dateRanges}
        selectedDate={selectedDate}
        onSelectDate={handleDateChange}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          {/* Date Header */}
          <div className="flex items-center justify-between mb-6 mt-4">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <BsCalendar3 className="mr-2" />
              <h2 className="text-xl font-medium text-gray-800 dark:text-white">
                {selectedDate ? format(parseISO(selectedDate), 'MMMM d, yyyy') : ''}
              </h2>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full"
                title="Write in diary"
              >
                <BsPencilSquare className="text-xl" />
              </button>
              <button
                onClick={() => setIsRecording(true)}
                className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full"
                title="Record audio note"
              >
                <BsMic className="text-xl" />
              </button>
            </div>
          </div>
          
          {/* Diary Content */}
          {isEditing ? (
            <DiaryEditor 
              initialContent={currentEntry?.content || ''}
              onSave={handleSaveEntry}
              onCancel={() => setIsEditing(false)}
            />
          ) : isRecording ? (
            <VoiceRecorder 
              onSave={handleSaveAudio}
              onCancel={() => setIsRecording(false)}
            />
          ) : currentEntry ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              {currentEntry.content ? (
                <div 
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentEntry.content }}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  No entry for this date. Click the edit button to start writing.
                </p>
              )}
              
              {currentEntry.audioUrl && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                    Audio Note
                  </h3>
                  <audio 
                    src={currentEntry.audioUrl} 
                    controls 
                    className="w-full"
                  />
                </div>
              )}
              
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-right">
                Last updated: {currentEntry.updatedAt 
                  ? format(parseISO(currentEntry.updatedAt), 'MMM d, yyyy HH:mm') 
                  : 'Never'}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You haven't created an entry for this date yet.
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                <BsPencilSquare className="mr-2" /> Write an Entry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiaryPage;