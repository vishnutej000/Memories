import { ApiClient } from './client';

export interface ExportOptions {
  chatId: string;
  format: 'pdf' | 'html' | 'csv' | 'json';
  includeMedia?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  participants?: string[];
}

export class ExportService {
  static async generateExport(options: ExportOptions): Promise<Blob> {
    try {
      const response = await ApiClient.post<Blob>('/export/generate', options, {
        responseType: 'blob' as any
      });
      return response;
    } catch (error) {
      console.error('Error generating export:', error);
      throw new Error('Failed to generate export. Please try again later.');
    }
  }

  static async getExportProgress(jobId: string): Promise<number> {
    try {
      const response = await ApiClient.get<{ progress: number }>(`/export/progress/${jobId}`);
      return response.progress;
    } catch (error) {
      console.error('Error getting export progress:', error);
      return 0;
    }
  }

  static getExportFileType(format: string): string {
    switch (format) {
      case 'pdf':
        return 'application/pdf';
      case 'html':
        return 'text/html';
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }

  static getExportFileName(chatName: string, format: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `whatsapp-chat-${chatName}-${timestamp}.${format}`;
  }

  // Fallback method to generate fake PDF when backend is not available
  static async generateFallbackPDF(chatName: string): Promise<Blob> {
    // Simulating a wait time for generating the "export"
    await new Promise(resolve => setTimeout(resolve, 1500));

    // This is a minimal PDF file in base64 format
    const minimalPdfBase64 = `
      JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PCAvVHlwZSAvWE9iamVjdCAvU3VidHlwZSAvSW1hZ2UgL1dpZ
      HRoIDYwMCAvSGVpZ2h0IDQwMCAvQ29sb3JTcGFjZSBbL0luZGV4ZWQgL0RldmljZVJHQiAyNTUgPDwgL0
      ZpbHRlciAvRmxhdGVEZWNvZGUgL0xlbmd0aCAyMCA+Pl0gL0JpdHNQZXJDb21wb25lbnQgOCAvRmlsdGV
      yIC9GbGF0ZURlY29kZSAvTGVuZ3RoIDEwMCA+PgpzdHJlYW0KeJztwTEBAAAAwqD1T20JT6AAAAAAAAA
      AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALg
      BqS4AAQplbmRzdHJlYW0KZW5kb2JqCjYgMCBvYmoKPDwgL0xlbmd0aCA5MCA+PgpzdHJlYW0KeJxdjcE
      KwjAQRO+C/7DHbJJ2G1sPQhH0qhU8iTfBJIVCm2Kbg3/viYKHORzmzbCTOX1ezr3MEE7R+xEDJJndGK5
      1l5vS7QNQQRoKsopzmbjuuJquXF/9A1M0LHJt1La2GQJHPEGZlmDLlJ9cEfVOC0TJWvCK5bzYHHYZ7Y9
      QJc/DOXGdCeBNUlCSAQplbmRzdHJlYW0KZW5kb2JqCjcgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmV
      udCAzIDAgUiAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA0IDAgUiA+PiAvWE9iamVjdCA8PCAvWDU
      gNSAwIFIgPj4gPj4gL0NvbnRlbnRzIDYgMCBSIC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdID4+CmVuZG9
      iago0IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL1RpbWVzLVJ
      vbWFuID4+CmVuZG9iago4IDAgb2JqCjw8IC9UeXBlIC9QYWdlcyAvTWVkaWFCb3ggWzAgMCA2MTIgNzk
      yXSAvQ291bnQgMSAvS2lkcyBbIDcgMCBSIF0gPj4KZW5kb2JqCjkgMCBvYmoKPDwgL1R5cGUgL0NhdGF
      sb2cgL1BhZ2VzIDggMCBSID4+CmVuZG9iagoxMCAwIG9iago8PCAvVGl0bGUgKFdoYXRzQXBwIENoYXQ
      gRXhwb3J0KSAvQXV0aG9yIChXaGF0c0FwcCBNZW1vcnkgVmF1bHQpIC9DcmVhdG9yIChXaGF0c0FwcCB
      NZW1vcnkgVmF1bHQpIC9Qcm9kdWNlciAoV2hhdHNBcHAgTWVtb3J5IFZhdWx0KSAvQ3JlYXRpb25EYXR
      lIChEOjIwMjIwNjE1MTIwMDAwWikgPj4KZW5kb2JqCnhyZWYKMCAxMQowMDAwMDAwMDAwIDY1NTM1IGY
      gCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDI1MCAwMDAwMCBuIAowMDAwMDAwNTAwIDAwMDAwIG4
      gCjAwMDAwMDA4MDAgMDAwMDAgbiAKMDAwMDAwMTAwMCAwMDAwMCBuIAowMDAwMDAyNTAwIDAwMDAwIG4
      gCjAwMDAwMDI2NDAgMDAwMDAgbiAKMDAwMDAwMjg4MCAwMDAwMCBuIAowMDAwMDAyOTc5IDAwMDAwIG4
      gCjAwMDAwMDMwMjQgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSAxMSAvUm9vdCA5IDAgUiAvSW5mbyA
      xMCAwIFIgL0lEIFsgPDA3OEFEOEZCRDYwQkIzMTA2MDNEO4QxOTU1RkU4RTI4PiA8MDc4QUQ4RkJENjB
      CQjMxMDYwM0Q4IDE5NTVGRThFMjg+IF0gPj4Kc3RhcnR4cmVmCjMyMTkKJSVFT0YK
    `;
    
    // Convert base64 to Blob
    const byteCharacters = atob(minimalPdfBase64.trim());
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'application/pdf' });
  }
}
