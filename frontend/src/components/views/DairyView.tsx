import React, { useState } from 'react';
import { useChatData } from '../../hooks/useChatData';
import DateSeparator from '../ChatInterface/DateSeparator';
import MessageBubble from '../ChatInterface/MessageBubble';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

const DiaryView: React.FC = () => {
  const { messages, userIdentity, loading, error } = useChatData();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [diaryEntry, setDiaryEntry] = useState<string>('');
  const [savedDiaryEntries, setSavedDiaryEntries] = useState<Record<string, { text: string, audio?: string }>>({});
  
  const { 
    isRecording, 
    recordingTime, 
    startRecording, 
    stopRecording, 
    cancelRecording 
  } = useAudioRecorder({
    onRecordingComplete: (audioBlob) => {
      const dateKey = selectedDate.toISOString().split('T')[0];
      setSavedDiaryEntries(prev => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          audio: URL.createObjectURL(audioBlob)
        }
      }));
    }
  });

  // Group messages by date
  const messagesByDate = messages.reduce((acc, message) => {
    const date = new Date(message.timestamp);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    
    acc[dateKey].push(message);
    return acc;
  }, {} as Record<string, typeof messages>);
  
  // Get unique dates from messages
  const uniqueDates = Object.keys(messagesByDate).sort().reverse();
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Handle date selection
  const handleDateSelect = (dateString: string) => {
    setSelectedDate(new Date(dateString));
    
    // Load saved diary entry if exists
    if (savedDiaryEntries[dateString]) {
      setDiaryEntry(savedDiaryEntries[dateString].text || '');
    } else {
      setDiaryEntry('');
    }
  };
  
  // Save diary entry
  const handleSaveDiary = () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    setSavedDiaryEntries(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        text: diaryEntry
      }
    }));
  };
  
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-whatsapp-teal mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading your diary...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900">Error Loading Diary</h3>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }
  
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-whatsapp-teal text-4xl mb-4">📔</div>
          <h3 className="text-lg font-medium text-gray-900">Your Diary is Empty</h3>
          <p className="mt-2 text-gray-600">
            Import your WhatsApp chat export to start your diary journey.
          </p>
          <button 
            className="mt-4 px-4 py-2 bg-whatsapp-teal text-white rounded-lg shadow hover:bg-opacity-90"
            onClick={() => {/* Open import modal */}}
          >
            Import Chat
          </button>
        </div>
      </div>
    );
  }
  
  const selectedDateKey = selectedDate.toISOString().split('T')[0];
  const selectedDateMessages = messagesByDate[selectedDateKey] || [];
  const savedEntry = savedDiaryEntries[selectedDateKey];
  
  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Date Sidebar */}
      <div className="w-60 bg-gray-50 border-r overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b sticky top-0 bg-gray-50 z-10">
          <h2 className="text-lg font-medium text-gray-900">Your Diary</h2>
          <p className="text-sm text-gray-500">Select a date to view and add entries</p>
        </div>
        
        <div className="divide-y">
          {uniqueDates.map(dateKey => (
            <button
              key={dateKey}
              className={`w-full p-3 text-left hover:bg-gray-100 transition-colors ${
                selectedDateKey === dateKey ? 'bg-whatsapp-green-light' : ''
              }`}
              onClick={() => handleDateSelect(dateKey)}
            >
              <p className="font-medium text-sm">{formatDate(dateKey)}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {messagesByDate[dateKey].length} messages
                </span>
                {savedDiaryEntries[dateKey] && (
                  <div className="flex space-x-1">
                    {savedDiaryEntries[dateKey].text && (
                      <span title="Has diary entry">📝</span>
                    )}
                    {savedDiaryEntries[dateKey].audio && (
                      <span title="Has voice note">🎤</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Selected Date Header */}
        <div className="bg-white border-b p-4">
          <h2 className="text-xl font-medium text-gray-900">
            {formatDate(selectedDateKey)}
          </h2>
        </div>
        
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Messages for the day */}
          <div className="md:w-1/2 overflow-y-auto p-4 bg-whatsapp-bg">
            <h3 className="text-center text-sm font-medium text-gray-500 mb-4">
              Conversation
            </h3>
            
            {selectedDateMessages.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No messages on this date
              </div>
            ) : (
              <>
                <DateSeparator 
                  date={new Date(selectedDateKey)} 
                  sentiment={{
                    score: Math.random() * 2 - 1, // Mock sentiment
                    label: Math.random() > 0.6 ? 'positive' : Math.random() > 0.3 ? 'neutral' : 'negative'
                  }}
                />
                
                {selectedDateMessages.map(message => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.sender === userIdentity}
                  />
                ))}
              </>
            )}
          </div>
          
          {/* Diary Entry */}
          <div className="md:w-1/2 border-t md:border-t-0 md:border-l overflow-y-auto flex flex-col">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Your Thoughts
                </h3>
                
                <div className="flex space-x-2">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="text-whatsapp-teal hover:bg-gray-100 p-2 rounded-full"
                      title="Record voice note"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={stopRecording}
                        className="bg-whatsapp-teal text-white p-2 rounded-full"
                        title="Stop recording"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={cancelRecording}
                        className="bg-red-500 text-white p-2 rounded-full"
                        title="Cancel recording"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      <span className="text-sm text-gray-500 flex items-center">
                        Recording: {recordingTime}s
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Voice Note Player */}
              {savedEntry?.audio && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                  <audio 
                    controls 
                    className="w-full" 
                    src={savedEntry.audio}
                  ></audio>
                </div>
              )}
              
              {/* Text Diary Entry */}
              <textarea
                className="w-full h-40 p-3 border rounded-lg focus:ring-2 focus:ring-whatsapp-teal focus:border-whatsapp-teal resize-none"
                placeholder="Write your thoughts about this day..."
                value={diaryEntry}
                onChange={(e) => setDiaryEntry(e.target.value)}
              ></textarea>
              
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSaveDiary}
                  className="px-4 py-2 bg-whatsapp-teal text-white rounded-lg shadow hover:bg-opacity-90"
                  disabled={diaryEntry === savedEntry?.text}
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryView;