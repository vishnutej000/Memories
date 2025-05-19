import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useChat } from '../hooks/useChat';
import { useDiary } from '../hooks/useDiary';
import DiaryEditor from '../components/diary/DiaryEditor';
import VoiceRecorder from '../components/diary/VoiceRecorder';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorMessage from '../components/common/ErrorMessage';
import DateNavigator from '../components/chat/DateNavigator';

const DiaryPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const { dateRanges, loading: chatLoading, error: chatError } = useChat(chatId);
  const { entry, loading: diaryLoading, error: diaryError, saveEntry } = useDiary(
    chatId || '',
    selectedDate
  );
  
  // Select most recent date by default
  useEffect(() => {
    if (dateRanges.length > 0 && !selectedDate) {
      // Sort by date (newest first) and select the first one
      const sortedDates = [...dateRanges].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setSelectedDate(sortedDates[0].date);
    }
  }, [dateRanges, selectedDate]);
  
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };
  
  const handleSave = async (text: string, emotion: any, hasAudio: boolean, audioDuration?: number) => {
    if (!chatId || !selectedDate) return;
    
    try {
      await saveEntry(text, emotion, hasAudio, audioDuration);
    } catch (error) {
      console.error('Error saving diary entry:', error);
    }
  };
  
  if (!chatId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            No chat selected
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Please select a chat from the sidebar or upload a new chat.
          </p>
        </div>
      </div>
    );
  }
  
  if (chatLoading) {
    return <LoadingScreen message="Loading diary data..." />;
  }
  
  if (chatError) {
    return <ErrorMessage message={chatError} />;
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-white dark:bg-gray-800 shadow rounded-lg mb-4">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          Your Diary
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Capture your thoughts and feelings about this conversation
        </p>
      </div>
      
      <div className="flex-1 flex">
        {/* Date Navigator Sidebar */}
        <div className="w-24 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mr-4">
          <DateNavigator 
            dates={dateRanges} 
            onSelectDate={handleDateSelect} 
            selectedDate={selectedDate}
          />
        </div>
        
        {/* Main Diary Content */}
        <div className="flex-1 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          {!selectedDate ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">
                Select a date from the sidebar to view or create a diary entry
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
                </h2>
                {diaryLoading ? (
                  <p className="text-gray-500 dark:text-gray-400 animate-pulse">
                    Loading diary entry...
                  </p>
                ) : diaryError ? (
                  <ErrorMessage message={diaryError} />
                ) : null}
              </div>
              
              <VoiceRecorder 
                chatId={chatId} 
                date={selectedDate}
                onRecordingChange={(hasRecording, duration) => {
                  if (entry) {
                    handleSave(entry.text, entry.emotion, hasRecording, duration);
                  }
                }}
              />
              
              <div className="mt-6">
                <DiaryEditor 
                  initialText={entry?.text || ''} 
                  initialEmotion={entry?.emotion || 'neutral'}
                  onSave={(text, emotion) => {
                    handleSave(text, emotion, !!entry?.has_audio, entry?.audio_duration);
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiaryPage;