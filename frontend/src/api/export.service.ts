import apiClient from './client';
import { ExportOptions } from '../types/export.types';

export const ExportService = {
  /**
   * Generate and download PDF export
   */
  exportToPdf: async (
    chatId: string, 
    options: ExportOptions
  ): Promise<Blob> => {
    const response = await apiClient.post(
      `/export/${chatId}/pdf`, 
      options, 
      { responseType: 'blob' }
    );
    
    return response as unknown as Blob;
  },

  /**
   * Export full session as ZIP
   */
  exportSession: async (chatId: string): Promise<Blob> => {
    const response = await apiClient.get(
      `/export/${chatId}/session`, 
      { responseType: 'blob' }
    );
    
    return response as unknown as Blob;
  },

  /**
   * Preview PDF without downloading
   */
  previewPdf: async (
    chatId: string, 
    options: ExportOptions
  ): Promise<string> => {
    return apiClient.post(`/export/${chatId}/preview`, options);
  }
};