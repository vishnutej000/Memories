// Additional type definitions for testing and third-party libraries
import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string): R;
      toHaveStyle(style: Record<string, any>): R;
      toHaveClass(className: string): R;
      toHaveAttribute(attr: string, value?: string): R;
    }
  }

  interface Window {
    testIntegration?: () => Promise<void>;
  }
}

// Fix for d3-cloud default import
declare module 'd3-cloud' {
  interface CloudLayout {
    size(size: [number, number]): CloudLayout;
    words(words: any[]): CloudLayout;
    padding(padding: number): CloudLayout;
    font(font: string): CloudLayout;
    fontSize(fontSize: (d: any) => number): CloudLayout;
    rotate(rotate: number): CloudLayout;
    on(event: string, listener: (words: any[]) => void): CloudLayout;
    start(): CloudLayout;
  }

  function cloud(): CloudLayout;
  export default cloud;
}

export {};
