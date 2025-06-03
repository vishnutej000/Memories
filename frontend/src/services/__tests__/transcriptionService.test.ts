import { renderHook, act } from '@testing-library/react';
import { useTranscription, AudioTranscriptionService } from '../transcriptionService';

// Mock Web Speech API
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  maxAlternatives: 1,
  onstart: null,
  onresult: null,
  onerror: null,
  onend: null
};

const mockSpeechRecognitionConstructor = jest.fn(() => mockSpeechRecognition);

// Setup global mocks
Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: mockSpeechRecognitionConstructor
});

// Mock fetch for AudioTranscriptionService
global.fetch = jest.fn();

describe('Transcription Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSpeechRecognition.onstart = null;
    mockSpeechRecognition.onresult = null;
    mockSpeechRecognition.onerror = null;
    mockSpeechRecognition.onend = null;
  });

  describe('useTranscription hook', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useTranscription());

      expect(result.current.isSupported).toBe(true);
      expect(result.current.isListening).toBe(false);
      expect(result.current.transcript).toBe('');
      expect(result.current.error).toBe(null);
    });

    it('should start listening when startListening is called', () => {
      const { result } = renderHook(() => useTranscription());

      act(() => {
        result.current.startListening();
      });

      expect(mockSpeechRecognitionConstructor).toHaveBeenCalled();
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
      expect(mockSpeechRecognition.continuous).toBe(true);
      expect(mockSpeechRecognition.interimResults).toBe(true);
      expect(mockSpeechRecognition.lang).toBe('en-US');
    });

    it('should configure recognition with provided options', () => {
      const { result } = renderHook(() => useTranscription());

      act(() => {
        result.current.startListening({
          language: 'es-ES',
          continuous: false,
          interimResults: false,
          maxAlternatives: 3
        });
      });

      expect(mockSpeechRecognition.lang).toBe('es-ES');
      expect(mockSpeechRecognition.continuous).toBe(false);
      expect(mockSpeechRecognition.interimResults).toBe(false);
      expect(mockSpeechRecognition.maxAlternatives).toBe(3);
    });

    it('should handle start event', () => {
      const { result } = renderHook(() => useTranscription());

      act(() => {
        result.current.startListening();
      });

      // Simulate start event
      act(() => {
        if (mockSpeechRecognition.onstart) {
          mockSpeechRecognition.onstart.call(mockSpeechRecognition, new Event('start'));
        }
      });

      expect(result.current.isListening).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('should handle result event', () => {
      const { result } = renderHook(() => useTranscription());

      act(() => {
        result.current.startListening();
      });

      // Simulate result event
      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: 'Hello world', confidence: 0.9 }
          }
        ]
      };

      act(() => {
        if (mockSpeechRecognition.onresult) {
          mockSpeechRecognition.onresult.call(mockSpeechRecognition, mockEvent as any);
        }
      });

      expect(result.current.transcript).toBe('Hello world');
    });

    it('should handle interim results', () => {
      const { result } = renderHook(() => useTranscription());

      act(() => {
        result.current.startListening();
      });

      // Simulate interim result
      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: false,
            0: { transcript: 'Hello', confidence: 0.7 }
          }
        ]
      };

      act(() => {
        if (mockSpeechRecognition.onresult) {
          mockSpeechRecognition.onresult.call(mockSpeechRecognition, mockEvent as any);
        }
      });

      expect(result.current.transcript).toBe('Hello');

      // Simulate final result
      const finalEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: 'Hello world', confidence: 0.9 }
          }
        ]
      };

      act(() => {
        if (mockSpeechRecognition.onresult) {
          mockSpeechRecognition.onresult.call(mockSpeechRecognition, finalEvent as any);
        }
      });

      expect(result.current.transcript).toBe('Hello world');
    });

    it('should handle error event', () => {
      const { result } = renderHook(() => useTranscription());

      act(() => {
        result.current.startListening();
      });

      // Simulate error event
      const mockError = {
        error: 'network',
        message: 'Network error occurred'
      };

      act(() => {
        if (mockSpeechRecognition.onerror) {
          mockSpeechRecognition.onerror.call(mockSpeechRecognition, mockError as any);
        }
      });

      expect(result.current.error).toBe('Speech recognition error: network');
      expect(result.current.isListening).toBe(false);
    });

    it('should stop listening when stopListening is called', () => {
      const { result } = renderHook(() => useTranscription());

      act(() => {
        result.current.startListening();
      });

      act(() => {
        result.current.stopListening();
      });

      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
      expect(result.current.isListening).toBe(false);
    });

    it('should reset transcript when resetTranscript is called', () => {
      const { result } = renderHook(() => useTranscription());

      // Set some transcript and error
      act(() => {
        result.current.startListening();
      });

      const mockEvent = {
        resultIndex: 0,
        results: [
          {
            isFinal: true,
            0: { transcript: 'Test transcript', confidence: 0.9 }
          }
        ]
      };

      act(() => {
        if (mockSpeechRecognition.onresult) {
          mockSpeechRecognition.onresult.call(mockSpeechRecognition, mockEvent as any);
        }
      });

      expect(result.current.transcript).toBe('Test transcript');

      act(() => {
        result.current.resetTranscript();
      });

      expect(result.current.transcript).toBe('');
      expect(result.current.error).toBe(null);
    });

    it('should handle unsupported browser', () => {
      // Temporarily remove speech recognition support
      const originalWebkit = window.webkitSpeechRecognition;
      const originalSpeech = (window as any).SpeechRecognition;
      
      delete (window as any).webkitSpeechRecognition;
      delete (window as any).SpeechRecognition;

      const { result } = renderHook(() => useTranscription());

      expect(result.current.isSupported).toBe(false);

      act(() => {
        result.current.startListening();
      });

      expect(result.current.error).toBe('Speech recognition is not supported in this browser');

      // Restore original values
      (window as any).webkitSpeechRecognition = originalWebkit;
      (window as any).SpeechRecognition = originalSpeech;
    });
  });

  describe('AudioTranscriptionService', () => {
    const mockFile = new File(['audio data'], 'test-audio.wav', { type: 'audio/wav' });

    beforeEach(() => {
      (fetch as jest.Mock).mockClear();
    });

    it('should transcribe audio file successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          transcript: 'Transcribed text',
          confidence: 0.95
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await AudioTranscriptionService.transcribeAudioFile(mockFile, 'en-US');

      expect(fetch).toHaveBeenCalledWith('/api/v1/audio/transcribe', {
        method: 'POST',
        body: expect.any(FormData)
      });

      expect(result).toEqual({
        transcript: 'Transcribed text',
        confidence: 0.95
      });
    });

    it('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        AudioTranscriptionService.transcribeAudioFile(mockFile)
      ).rejects.toThrow('HTTP error! status: 500');
    });

    it('should fall back to Web Speech API for small files', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const smallFile = new File(['small audio'], 'small.wav', { type: 'audio/wav' });
      Object.defineProperty(smallFile, 'size', { value: 1024 * 1024 }); // 1MB

      const result = await AudioTranscriptionService.transcribeAudioFile(smallFile);

      expect(result).toEqual({
        transcript: 'Transcription from Web Speech API fallback',
        confidence: 0.5
      });
    });

    it('should get transcription status', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          status: 'completed',
          progress: 100,
          transcript: 'Final transcript'
        })
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await AudioTranscriptionService.getTranscriptionStatus('task-123');

      expect(fetch).toHaveBeenCalledWith('/api/v1/audio/transcription-status/task-123');
      expect(result).toEqual({
        status: 'completed',
        progress: 100,
        transcript: 'Final transcript'
      });
    });

    it('should handle transcription status errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        AudioTranscriptionService.getTranscriptionStatus('invalid-task')
      ).rejects.toThrow('HTTP error! status: 404');
    });
  });
});
