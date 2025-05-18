import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob) => void;
  maxDuration?: number; // Maximum recording time in seconds
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  audioURL: string | null;
}

export const useAudioRecorder = ({
  onRecordingComplete,
  maxDuration = 300 // 5 minutes default
}: UseAudioRecorderProps = {}): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [isRecording, audioURL]);
  
  // Start recording
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      // Reset state
      audioChunksRef.current = [];
      setRecordingTime(0);
      setAudioURL(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up data handling
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Set up completion handling
      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length === 0) return;
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob);
        }
        
        // Stop all audio tracks
        stream.getAudioTracks().forEach(track => track.stop());
        
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Set up timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          // Auto-stop if max duration reached
          if (prev >= maxDuration - 1) {
            if (mediaRecorderRef.current) {
              mediaRecorderRef.current.stop();
              setIsRecording(false);
            }
            if (timerRef.current) {
              window.clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      throw new Error('Could not access microphone. Please check your browser permissions.');
    }
  }, [maxDuration, onRecordingComplete]);
  
  // Stop recording
  const stopRecording = useCallback((): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);
  
  // Cancel recording
  const cancelRecording = useCallback((): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear chunks to prevent saving
      audioChunksRef.current = [];
    }
  }, [isRecording]);
  
  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
    audioURL
  };
};

export default useAudioRecorder;