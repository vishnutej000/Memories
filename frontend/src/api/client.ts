import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  private worker: Worker | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
      },
      // Important: Allow large file uploads
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Initialize Web Worker for large data processing if supported
    if (typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(new URL('../workers/dataProcessor.ts', import.meta.url), {
          type: 'module'
        });
      } catch (e) {
        console.warn('Web Workers not fully supported in this browser:', e);
      }
    }
  }

  // For large file uploads, use native fetch with progress monitoring
  async uploadFile(
    file: File, 
    endpoint: string, 
    userIdentifier: string,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_identifier', userIdentifier);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', `${this.client.defaults.baseURL}${endpoint}`);
      
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        };
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  }

  // Process large JSON responses in a Web Worker
  async getWithWorker<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    if (!this.worker) {
      // Fallback to direct processing if Web Workers aren't supported
      return this.client.get<T>(url, config).then(response => response.data);
    }

    const response = await this.client.get(url, config);
    
    // If the response is small, process it directly
    if (JSON.stringify(response.data).length < 1000000) {
      return response.data;
    }
    
    // For large responses, process in the Web Worker
    return new Promise((resolve, reject) => {
      const messageId = Date.now().toString();
      
      const messageHandler = (event: MessageEvent) => {
        if (event.data.id === messageId) {
          this.worker?.removeEventListener('message', messageHandler);
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };
      
      this.worker?.addEventListener('message', messageHandler);
      
      this.worker?.postMessage({
        id: messageId,
        action: 'process',
        data: response.data,
      });
    });
  }

  // Standard API methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export default new ApiClient();