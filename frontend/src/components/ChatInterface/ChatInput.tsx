import React, { useState, useRef, KeyboardEvent } from 'react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

interface ChatInputProps {
  onSendMessage: (content: string, type: 'text' | 'audio') => void;
  onAttachMedia: () => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onAttachMedia, 
  disabled = false 
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    isRecording, 
    recordingTime, 
    startRecording, 
    stopRecording, 
    cancelRecording 
  } = useAudioRecorder({
    onRecordingComplete: (audioBlob) => {
      onSendMessage(URL.createObjectURL(audioBlob), 'audio');
    }
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message, 'text');
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-100 border-t px-4 py-2">
      {isRecording ? (
        <div className="flex items-center">
          <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center">
            <div className="animate-pulse w-2 h-2 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm text-gray-600">
              Recording... {formatRecordingTime(recordingTime)}
            </span>
          </div>
          <button 
            onClick={stopRecording}
            className="ml-2 bg-whatsapp-teal text-white rounded-full p-2"
            title="Send voice note"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={cancelRecording}
            className="ml-2 bg-red-500 text-white rounded-full p-2"
            title="Cancel recording"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex items-end">
          <button 
            onClick={onAttachMedia}
            className="text-gray-500 hover:text-gray-700 focus:outline-none mr-2"
            disabled={disabled}
            title="Attach media"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <div className="flex-1 bg-white rounded-full overflow-hidden flex items-end">
            <textarea
              ref={textareaRef}
              className="w-full px-4 py-2 text-sm resize-none focus:outline-none max-h-32"
              placeholder="Type a message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={disabled}
              style={{ overflowY: 'auto' }}
            />
          </div>
          
          {message.trim() ? (
            <button 
              onClick={handleSendMessage}
              className="ml-2 bg-whatsapp-teal text-white rounded-full p-2 focus:outline-none"
              disabled={disabled}
              title="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={startRecording}
              className="ml-2 bg-whatsapp-teal text-white rounded-full p-2 focus:outline-none"
              disabled={disabled}
              title="Record voice note"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatInput;