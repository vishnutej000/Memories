import { useState, useEffect } from 'react';

/**
 * Custom hook for working with localStorage with type safety
 * @param key The key to store the value under
 * @param initialValue The initial value to use if there is no value in localStorage
 * @returns A tuple with the current value and a function to update the value
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Get from local storage then
  // parse stored json or return initialValue
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    if (typeof window === 'undefined') {
      console.warn(`Tried setting localStorage key "${key}" even though environment is not a browser`);
      return;
    }

    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save to state
      setStoredValue(valueToStore);
      
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Dispatch a custom event so other instances can update
      window.dispatchEvent(new Event('local-storage-change'));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes to this localStorage key in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    // Handle custom event for non-window storage updates
    const handleCustomEvent = () => {
      setStoredValue(readValue());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-change', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-change', handleCustomEvent);
    };
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Get an estimate of localStorage usage
 * @returns Object with current usage size and percentage
 */
export function getLocalStorageUsage() {
  if (typeof window === 'undefined') {
    return { size: 0, percentage: 0, available: 0, formatted: '0 KB' };
  }
  
  let total = 0;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          // Each character is 2 bytes in UTF-16
          total += (key.length + value.length) * 2;
        }
      }
    }
  } catch (e) {
    console.error('Error calculating localStorage size', e);
  }

  // LocalStorage limit is typically 5-10MB
  const limit = 5 * 1024 * 1024; // 5MB in bytes
  const percentUsed = (total / limit) * 100;
  const available = Math.max(0, limit - total);
  
  // Format size for display
  const formatted = formatSize(total);
  
  return {
    size: total,
    percentage: percentUsed,
    available,
    formatted
  };
}

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}