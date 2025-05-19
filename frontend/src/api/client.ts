import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken } from '../utils/auth';

class ApiClientClass {
  private client: AxiosInstance;
  private baseURL: string;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor() {
    // Use environment variable or default to localhost
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds timeout
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Retry logic for network errors or 5xx server errors
        const originalRequest = error.config;
        
        if (
          (error.code === 'ERR_NETWORK' || 
           (error.response && error.response.status >= 500)) && 
          originalRequest && 
          this.retryCount < this.maxRetries
        ) {
          this.retryCount++;
          console.log(`Retrying request (${this.retryCount}/${this.maxRetries})...`);
          
          // Wait for a short delay before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
          
          return this.client(originalRequest);
        }
        
        this.retryCount = 0;
        
        if (error.response) {
          // Handle different error status codes
          switch (error.response.status) {
            case 401:
              // Unauthorized - redirect to login
              window.location.href = '/login';
              break;
            case 403:
              // Forbidden
              console.error('Access forbidden:', error.response.data);
              break;
            case 404:
              // Not found
              console.error('Resource not found:', error.response.data);
              break;
            case 500:
              // Server error
              console.error('Server error:', error.response.data);
              break;
            default:
              console.error('API Error:', error.response.data);
          }
        } else if (error.request) {
          // Request was made but no response received
          console.error('Network Error: No response received from server');
        } else {
          // Something happened in setting up the request
          console.error('Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      console.error(`Error making GET request to ${url}:`, error);
      throw error;
    }
  }

  public async post<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error making POST request to ${url}:`, error);
      throw error;
    }
  }

  public async put<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`Error making PUT request to ${url}:`, error);
      throw error;
    }
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      console.error(`Error making DELETE request to ${url}:`, error);
      throw error;
    }
  }

  public async upload<T>(
    url: string, 
    file: File, 
    data?: Record<string, any>,
    onProgress?: (progress: number) => void,
  ): Promise<T> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }
      
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      };
      
      const response: AxiosResponse<T> = await this.client.post(url, formData, config);
      return response.data;
    } catch (error) {
      console.error(`Error uploading to ${url}:`, error);
      throw error;
    }
  }
}

// Named export (not default)
export const ApiClient = new ApiClientClass();