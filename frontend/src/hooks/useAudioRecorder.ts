import { useState, useRef, useCallback, useEffect } from 'react';
import { useIndexedDB } from './useIndexedDB';

export const useAudioRecorder = (chatId: string, date: string) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  const db = useIndexedDB();
  
  // Initialize audio element
  useEffect(() => {
    audioElementRef.current = new Audio();
    
    audioElementRef.current.onended = () => {
      setIsPlaying(false);
    };
    
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);
  
  // Check for existing audio note on mount
  useEffect(() => {
    const checkExistingAudio = async () => {
      try {
        const audioNote = await db.getFromIndex<{
          blob: Blob;
          duration: number;
        }>('audio_notes', 'by_chat_date', [chatId, date]);
        
        if (audioNote) {
          setAudioBlob(audioNote.blob);
          setRecordingTime(audioNote.duration);
          
          const url = URL.createObjectURL(audioNote.blob);
          setAudioUrl(url);
          
          if (audioElementRef.current) {
            audioElementRef.current.src = url;
          }
        }
      } catch (err) {
        console.error('Error checking for existing audio note:', err);
      }
    };
    
    checkExistingAudio();
  }, [chatId, date, db]);
  
  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Handle data available event
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = async () => {
        // Create blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // Create and set URL for playback
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        if (audioElementRef.current) {
          audioElementRef.current.src = url;
        }
        
        // Save to IndexedDB
        await db.put('audio_notes', {
          chatId,
          date,
          blob: audioBlob,
          duration: recordingTime,
          created_at: new Date().toISOString()
        });
        
        // Stop and release media stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Could not access microphone');
    }
  }, [chatId, date, db, audioUrl, recordingTime]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);
  
  // Toggle audio playback
  const togglePlayback = useCallback(() => {
    if (!audioElementRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, audioUrl]);
  
  // Delete recording
  const deleteRecording = useCallback(async () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    setAudioBlob(null);
    setIsPlaying(false);
    
    // Remove from IndexedDB
    try {
      await db.deleteItem('audio_notes', [chatId, date]);
    } catch (err) {
      console.error('Error deleting audio note:', err);
    }
  }, [chatId, date, db, audioUrl]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  return {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    isPlaying,
    error,
    startRecording,
    stopRecording,
    togglePlayback,
    deleteRecording,
    hasRecording: !!audioBlob
  };
};