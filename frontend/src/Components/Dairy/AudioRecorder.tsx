import React, { useState } from 'react';
import { useAudioRecorder } from '../../Hooks/useAudioRecorder';
import { useTranscription } from '../../services/transcriptionService';
import { uploadAudioNote } from '../../services/whatsappServices';
import Button from '../UI/Button';
import Spinner from '../UI/Spinner';

interface AudioRecorderProps {
  onRecordingComplete: (audioUrl: string, duration: number, transcript?: string) => void;
  chatId: string;
  date: string;
  enableTranscription?: boolean;
  initialAudioUrl?: string;
  initialAudioDuration?: number;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onRecordingComplete,
  chatId,
  date,
  enableTranscription = false,
  initialAudioUrl,
  initialAudioDuration
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  
  // Use transcription hook only if enabled
  const transcriptionHook = useTranscription();
  const {
    isSupported: transcriptionSupported,
    isListening,
    transcript,
    error: transcriptionError,
    startListening,
    stopListening,
    resetTranscript
  } = transcriptionHook;

  // Use audio recorder hook
  const {
    isRecording,
    recordingTime,
    audioUrl,
    error: recordingError,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording
  } = useAudioRecorder({
    maxDurationSeconds: 120, // 2 minute max
    onRecordingComplete: async (blob, duration) => {
      try {
        setIsUploading(true);
        setError(null);
        
        // Stop transcription if it was running
        if (enableTranscription && isListening) {
          stopListening();
        }
        
        // Upload audio using the whatsappServices function
        const audioNoteUrl = await uploadAudioNote(chatId, date, blob);
        
        // Pass transcript if available
        const finalTranscript = enableTranscription ? currentTranscript : undefined;
        onRecordingComplete(audioNoteUrl, duration, finalTranscript);
        
        // Reset transcript
        if (enableTranscription) {
          setCurrentTranscript('');
        }
      } catch (err) {
        console.error('Error uploading audio:', err);
        setError(err instanceof Error ? err.message : 'Failed to upload audio');
      } finally {
        setIsUploading(false);
      }
    }
  });

  // Start recording with optional transcription
  const startRecording = async () => {
    setError(null);
    setCurrentTranscript('');
    
    if (enableTranscription && transcriptionSupported) {
      resetTranscript();
      startListening({
        continuous: true,
        interimResults: true,
        language: 'en-US'
      });
    }
    
    await startAudioRecording();
  };

  // Stop recording
  const stopRecording = () => {
    if (enableTranscription && isListening) {
      stopListening();
      setCurrentTranscript(transcript);
    }
    stopAudioRecording();
  };

  // Update current transcript when speech recognition updates
  React.useEffect(() => {
    if (enableTranscription && transcript) {
      setCurrentTranscript(transcript);
    }
  }, [transcript, enableTranscription]);

  // Format recording time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Use initial audio if provided
  const displayAudioUrl = audioUrl || initialAudioUrl;
  const displayDuration = initialAudioDuration;
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
            {enableTranscription && isListening && " • Transcribing..."}
          </p>
        </div>
      )}
      
      {/* Audio player (after recording or if initial audio provided) */}
      {displayAudioUrl && !isRecording && !isUploading && (
        <div className="mb-6">
          <audio
            src={displayAudioUrl}
            controls
            className="w-full"
          ></audio>
          {displayDuration && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Duration: {formatTime(displayDuration)}
            </p>
          )}
        </div>
      )}

      {/* Live transcription display */}
      {enableTranscription && isRecording && currentTranscript && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Live Transcription:</p>
          <p className="text-blue-700 dark:text-blue-300 text-sm">{currentTranscript}</p>
        </div>
      )}
      
      {/* Error message */}
      {(error || recordingError || (enableTranscription && transcriptionError)) && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
          {error || recordingError || transcriptionError}
        </div>
      )}

      {/* Transcription not supported warning */}
      {enableTranscription && !transcriptionSupported && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-600 dark:text-yellow-400">
          Speech recognition is not supported in this browser. Audio will be recorded without transcription.
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
        ) : displayAudioUrl ? (
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
          </Button>        )}
      </div>
    </div>
  );
};

export default AudioRecorder;