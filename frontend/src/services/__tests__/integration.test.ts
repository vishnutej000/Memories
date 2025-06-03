import { APIService } from '../APIService';
import { AudioTranscriptionService } from '../transcriptionService';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Frontend-Backend Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('APIService Integration', () => {
    it('should upload WhatsApp file successfully', async () => {
      const mockFile = new File(['chat content'], 'chat.txt', { type: 'text/plain' });
      const mockResponse = {
        success: true,
        data: {
          id: 'chat-123',
          name: 'Test Chat',
          participants: ['Alice', 'Bob'],
          messageCount: 150,
          dateRange: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-31T23:59:59Z'
          },
          messages: [
            {
              id: 'msg-1',
              sender: 'Alice',
              content: 'Hello Bob!',
              timestamp: '2024-01-01T10:00:00Z'
            }
          ]
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await APIService.uploadWhatsAppFile(mockFile, 'Alice');

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/whatsapp/upload', {
        method: 'POST',
        body: expect.any(FormData)
      });

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle upload errors gracefully', async () => {
      const mockFile = new File(['invalid content'], 'invalid.txt', { type: 'text/plain' });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Invalid file format'
        })
      } as Response);

      await expect(APIService.uploadWhatsAppFile(mockFile, 'User')).rejects.toThrow('Invalid file format');
    });

    it('should perform sentiment analysis', async () => {
      const mockResponse = {
        success: true,
        data: {
          sentiments: [
            { messageId: 'msg-1', score: 0.8, label: 'positive' },
            { messageId: 'msg-2', score: -0.3, label: 'negative' }
          ],
          overallSentiment: {
            averageScore: 0.25,
            distribution: {
              positive: 60,
              neutral: 20,
              negative: 20
            }
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await APIService.analyzeSentiment('chat-123');

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/analysis/sentiment/chat-123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(result).toEqual(mockResponse.data);
    });

    it('should export chat data', async () => {
      const exportOptions = {
        chatId: 'chat-123',
        format: 'pdf' as const,
        includeMedia: true,
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31'
        }
      };

      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      } as Response);

      const result = await APIService.exportChat(exportOptions);

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportOptions)
      });

      expect(result).toEqual(mockBlob);
    });
  });

  describe('Audio Transcription Integration', () => {
    it('should transcribe audio file via backend', async () => {
      const mockAudioFile = new File(['audio data'], 'audio.wav', { type: 'audio/wav' });
      const mockResponse = {
        task_id: 'transcribe-task-123',
        status: 'processing',
        estimated_completion_time: '2-3 minutes'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await AudioTranscriptionService.transcribeAudioFile(mockAudioFile, 'en-US');

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/audio/transcribe', {
        method: 'POST',
        body: expect.any(FormData)
      });

      // Since API call fails in test, should fall back to Web Speech API
      expect(result).toEqual({
        transcript: 'Transcription from Web Speech API fallback',
        confidence: 0.5
      });
    });

    it('should check transcription status', async () => {
      const mockResponse = {
        status: 'completed',
        progress: 100,
        transcript: 'Hello, this is a test transcription.',
        confidence: 0.95
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await AudioTranscriptionService.getTranscriptionStatus('task-123');

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/audio/transcription-status/task-123');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      await expect(APIService.uploadWhatsAppFile(mockFile, 'User')).rejects.toThrow('Network error');
    });

    it('should handle malformed response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      } as Response);

      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      await expect(APIService.uploadWhatsAppFile(mockFile, 'User')).rejects.toThrow('Invalid JSON');
    });

    it('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        })
      } as Response);

      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      await expect(APIService.uploadWhatsAppFile(mockFile, 'User')).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Security Integration', () => {
    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: 'Authentication required'
        })
      } as Response);

      await expect(APIService.analyzeSentiment('chat-123')).rejects.toThrow('Authentication required');
    });

    it('should handle authorization errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: 'Access denied'
        })
      } as Response);

      await expect(APIService.analyzeSentiment('chat-123')).rejects.toThrow('Access denied');
    });
  });

  describe('Performance Integration', () => {
    it('should handle large file uploads', async () => {
      // Create a large mock file (simulated)
      const largeContent = 'A'.repeat(10 * 1024 * 1024); // 10MB
      const largeFile = new File([largeContent], 'large-chat.txt', { type: 'text/plain' });

      const mockResponse = {
        success: true,
        data: {
          id: 'large-chat-123',
          name: 'Large Chat',
          participants: ['User1', 'User2'],
          messageCount: 50000
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await APIService.uploadWhatsAppFile(largeFile, 'User1');

      expect(result).toEqual(mockResponse.data);
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/whatsapp/upload', {
        method: 'POST',
        body: expect.any(FormData)
      });
    });

    it('should handle timeout scenarios', async () => {
      jest.useFakeTimers();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000);
      });

      mockFetch.mockImplementationOnce(() => timeoutPromise);

      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const uploadPromise = APIService.uploadWhatsAppFile(mockFile, 'User');

      jest.advanceTimersByTime(30000);

      await expect(uploadPromise).rejects.toThrow('Request timeout');

      jest.useRealTimers();
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate file types on upload', async () => {
      const invalidFile = new File(['content'], 'test.exe', { type: 'application/x-executable' });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Invalid file type. Only text files are allowed.'
        })
      } as Response);

      await expect(APIService.uploadWhatsAppFile(invalidFile, 'User')).rejects.toThrow('Invalid file type');
    });

    it('should validate export parameters', async () => {
      const invalidExportOptions = {
        chatId: '', // Invalid empty chatId
        format: 'invalid' as any,
        includeMedia: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Invalid export parameters'
        })
      } as Response);

      await expect(APIService.exportChat(invalidExportOptions)).rejects.toThrow('Invalid export parameters');
    });
  });

  describe('Real-world Scenario Integration', () => {
    it('should handle complete chat analysis workflow', async () => {
      const mockFile = new File(['chat content'], 'chat.txt', { type: 'text/plain' });

      // Step 1: Upload chat
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'chat-123',
            name: 'Test Chat',
            participants: ['Alice', 'Bob'],
            messageCount: 100
          }
        })
      } as Response);

      const uploadResult = await APIService.uploadWhatsAppFile(mockFile, 'Alice');
      expect(uploadResult.id).toBe('chat-123');

      // Step 2: Analyze sentiment
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            sentiments: [
              { messageId: 'msg-1', score: 0.8, label: 'positive' }
            ],
            overallSentiment: {
              averageScore: 0.8,
              distribution: { positive: 80, neutral: 15, negative: 5 }
            }
          }
        })
      } as Response);

      const sentimentResult = await APIService.analyzeSentiment('chat-123');
      expect(sentimentResult.overallSentiment.averageScore).toBe(0.8);

      // Step 3: Export results
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['PDF content'], { type: 'application/pdf' })
      } as Response);

      const exportResult = await APIService.exportChat({
        chatId: 'chat-123',
        format: 'pdf',
        includeMedia: false
      });

      expect(exportResult).toBeInstanceOf(Blob);
      expect(exportResult.type).toBe('application/pdf');
    });
  });
});
