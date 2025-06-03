import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with testing-library matchers
expect.extend(matchers)

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;
  rootMargin: string = '0px';
  thresholds: ReadonlyArray<number> = [0];
  
  constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {}
  
  observe() {
    return null;
  }
  
  disconnect() {
    return null;
  }
  
  unobserve() {
    return null;
  }
  
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock HTMLMediaElement methods
Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
  writable: true,
  value: false,
})

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
})

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: jest.fn(),
})

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: jest.fn(),
})

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'blob:mock-url'),
})

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
})

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(() => Promise.resolve({
      getTracks: () => [{
        stop: jest.fn()
      }]
    })),
  },
})

// Mock localStorage
const localStorageMock = {
  length: 0,
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
const sessionStorageMock = {
  length: 0,
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
};
global.sessionStorage = sessionStorageMock as any;

// Mock File constructor
global.File = class File {
  constructor(bits: any[], name: string, options?: any) {
    return {
      bits,
      name,
      size: bits.reduce((acc, bit) => acc + (typeof bit === 'string' ? bit.length : bit.size || 0), 0),
      type: options?.type || '',
      lastModified: Date.now(),
      ...options
    } as any
  }
}

// Mock Blob constructor
global.Blob = class Blob {
  constructor(bits: any[], options?: any) {
    return {
      bits,
      size: bits.reduce((acc, bit) => acc + (typeof bit === 'string' ? bit.length : bit.size || 0), 0),
      type: options?.type || '',
      ...options
    } as any
  }
}

// Mock FileReader
global.FileReader = class FileReader {
  readAsText = jest.fn()
  readAsArrayBuffer = jest.fn()
  readAsDataURL = jest.fn()
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
  result: string | ArrayBuffer | null = null
}
