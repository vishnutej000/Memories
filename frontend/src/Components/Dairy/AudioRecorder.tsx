import React, { useState, useEffect } from 'react';
import { useAudioRecorder } from '../../Hooks/useAudioRecorder';
import { uploadAudioNote } from '../../services/whatsappServices';
import Button from '../UI/Button';
import Spinner from '../UI/Spinner';

interface AudioRecorderProps {
  onRecordingComplete: (audioUrl: string, duration: number) => void;
  chatId: string;
  date: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onRecordingComplete,
  chatId,
  date
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use audio recorder hook
  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    error: recordingError,
    startRecording,
    stopRecording
  } = useAudioRecorder({
    maxDurationSeconds: 120, // 2 minute max
    onRecordingComplete: async (blob, duration) => {
      try {
        setIsUploading(true);
        setError(null);
        
        // Upload audio to backend
        const audioNoteUrl = await uploadAudioNote(chatId, date, blob);
        
        // Call callback with URL and duration
        onRecordingComplete(audioNoteUrl, duration);
      } catch (err) {
        console.error('Error uploading audio:', err);
        setError(err instanceof Error ? err.message : 'Failed to upload audio');
      } finally {
        setIsUploading(false);
      }
    }
  });
  
  // Format recording time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="p-4">
      {/* Recording timer */}
      {isRecording && (
        <div className="mb-6 text-center">
          <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            {formatTime(recordingTime)}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Recording... (max 2 minutes)
          </p>
        </div>
      )}
      
      {/* Audio player (after recording) */}
      {audioUrl && !isRecording && !isUploading && (
        <div className="mb-6">
          <audio
            src={audioUrl}
            controls
            className="w-full"
          ></audio>
        </div>
      )}
      
      {/* Error message */}
      {(error || recordingError) && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
          {error || recordingError}
        </div>
      )}
      
      {/* Controls */}
      <div className="flex justify-center">
        {isRecording ? (
          <Button
            onClick={stopRecording}
            variant="danger"
            size="medium"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            }
          >
            Stop Recording
          </Button>
        ) : isUploading ? (
          <Button
            variant="primary"
            size="medium"
            disabled
            icon={<Spinner size="small" color="white" />}
          >
            Saving Recording...
          </Button>
        ) : audioUrl ? (
          <Button
            onClick={startRecording}
            variant="primary"
            size="medium"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            }
          >
            Record Again
          </Button>
        ) : (
          <Button
            onClick={startRecording}
            variant="primary"
            size="medium"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            }
          >
            Start Recording
          </Button>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;