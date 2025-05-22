import { useState, useEffect, useCallback } from 'react';
import { AudioRecorderOptions } from '../types';

/**
 * Custom hook for recording audio
 */
export function useAudioRecorder(options?: AudioRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const maxDuration = options?.maxDurationSeconds || 120; // Default 2 minutes
  
  // Clean up audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  // Update recording time
  useEffect(() => {
    let timerId: number;
    
    if (isRecording) {
      timerId = window.setInterval(() => {
        setRecordingTime(prev => {
          // Stop recording if max duration reached
          if (prev >= maxDuration) {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
            clearInterval(timerId);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [isRecording, maxDuration, mediaRecorder]);
  
  // Start recording
  const startRecording = useCallback(async () => {
    try {
      // Reset state
      setIsRecording(false);
      setRecordingTime(0);
      setAudioBlob(null);
      setAudioUrl(null);
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create recorder
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      // Audio chunks to store recording
      const audioChunks: Blob[] = [];
      
      // Handle data available
      recorder.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      });
      
      // Handle recording stop
      recorder.addEventListener('stop', () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Create blob from chunks
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Create URL for audio playback
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Set recording state
        setIsRecording(false);
        
        // Call onRecordingComplete callback if provided
        if (options?.onRecordingComplete) {
          options.onRecordingComplete(blob, recordingTime);
        }
      });
      
      // Start recording
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [recordingTime, options]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }, [mediaRecorder]);
  
  return {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording
  };
}