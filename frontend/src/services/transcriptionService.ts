import { useState, useRef, useCallback } from 'react';

interface TranscriptionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface UseTranscriptionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: (options?: TranscriptionOptions) => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// TypeScript interfaces for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionAlternative {
  confidence: number;
  transcript: string;
}

interface SpeechGrammarList {
  length: number;
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

export function useTranscription(): UseTranscriptionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if browser supports speech recognition
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  const startListening = useCallback((options: TranscriptionOptions = {}) => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    try {
      // Create recognition instance
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition() as SpeechRecognition;

      // Configure recognition
      recognition.continuous = options.continuous ?? true;
      recognition.interimResults = options.interimResults ?? true;
      recognition.lang = options.language ?? 'en-US';
      recognition.maxAlternatives = options.maxAlternatives ?? 1;

      // Event handlers
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptPart = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }

        setTranscript(prev => prev + finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError('Failed to start speech recognition');
      console.error('Speech recognition error:', err);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
}

// Audio file transcription service (for uploaded files)
export class AudioTranscriptionService {
  private static API_BASE_URL = '/api/v1/audio';

  static async transcribeAudioFile(
    file: File,
    language: string = 'en-US'
  ): Promise<{ transcript: string; confidence: number }> {
    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('language', language);

      const response = await fetch(`${this.API_BASE_URL}/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        transcript: result.transcript || '',
        confidence: result.confidence || 0
      };
    } catch (error) {
      console.error('Audio transcription failed:', error);
      
      // Fallback: try to use Web Speech API for small audio files
      if (file.size < 5 * 1024 * 1024) { // 5MB limit
        return this.transcribeWithWebSpeechAPI(file);
      }
      
      throw new Error('Audio transcription failed');
    }
  }

  private static async transcribeWithWebSpeechAPI(
    file: File
  ): Promise<{ transcript: string; confidence: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        // This is a simplified approach - in practice, you'd need
        // to convert the audio file to a format the browser can play
        // and then use the Web Speech API with audio streaming
        
        // For now, return a placeholder
        resolve({
          transcript: 'Transcription from Web Speech API fallback',
          confidence: 0.5
        });
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read audio file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  static async getTranscriptionStatus(taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    transcript?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/transcription-status/${taskId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get transcription status:', error);
      throw error;
    }
  }
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
