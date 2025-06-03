/**
 * Fetch API wrapper with built-in error handling
 */

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
}

/**
 * Base API configuration
 */
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  DEFAULT_TIMEOUT: 30000 // 30 seconds
};

/**
 * Error class for API responses
 */
export class ApiError extends Error {
  status: number;
  data: any;
  
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Create URL with query parameters
 */
function createUrl(endpoint: string, options?: FetchOptions): string {
  // Handle absolute URLs
  if (endpoint.startsWith('http')) {
    const url = new URL(endpoint);
    
    // Add query parameters if any
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString());
        }
      });
    }
    
    return url.toString();
  }
  
  // Handle relative URLs
  const baseUrl = API_CONFIG.BASE_URL.endsWith('/')
    ? API_CONFIG.BASE_URL.slice(0, -1)
    : API_CONFIG.BASE_URL;
  
  const path = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;
  
  const url = new URL(`${baseUrl}${path}`);
  
  // Add query parameters if any
  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
  }
  
  return url.toString();
}

/**
 * Handles fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number }): Promise<Response> {
  const { timeout = API_CONFIG.DEFAULT_TIMEOUT, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Process response based on content type
 */
async function processResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type');
  
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  
  if (contentType?.includes('text/')) {
    return response.text();
  }
  
  return response.blob();
}

/**
 * Main fetch wrapper
 */
async function fetchApi<T>(
  endpoint: string,
  options?: FetchOptions
): Promise<T> {
  try {
    // Create URL with query parameters
    const url = createUrl(endpoint, options);
    
    // Set up fetch options with default headers
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...options?.headers
      }
    };
    
    // Execute fetch with timeout
    const response = await fetchWithTimeout(url, fetchOptions);
    
    // Process response data
    const data = await processResponse(response);
    
    // Handle error responses
    if (!response.ok) {
      throw new ApiError(
        response.status,
        data?.message || response.statusText,
        data
      );
    }
    
    return data as T;
  } catch (error) {
    // Handle abort errors (timeouts)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout');
    }
    
    // Rethrow ApiError
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle other errors
    throw new ApiError(
      500,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// HTTP methods
export const api = {
  get: <T>(endpoint: string, options?: FetchOptions): Promise<T> => {
    return fetchApi<T>(endpoint, { ...options, method: 'GET' });
  },
  
  post: <T>(endpoint: string, data: any, options?: FetchOptions): Promise<T> => {
    return fetchApi<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  put: <T>(endpoint: string, data: any, options?: FetchOptions): Promise<T> => {
    return fetchApi<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  patch: <T>(endpoint: string, data: any, options?: FetchOptions): Promise<T> => {
    return fetchApi<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  
  delete: <T>(endpoint: string, options?: FetchOptions): Promise<T> => {
    return fetchApi<T>(endpoint, { ...options, method: 'DELETE' });
  },
  
  // Form data upload
  upload: <T>(endpoint: string, formData: FormData, options?: FetchOptions): Promise<T> => {
    return fetchApi<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type header for multipart/form-data
        // Browser will set it with the correct boundary
        ...options?.headers
      }
    });
  }
};