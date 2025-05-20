import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error: _,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-lg w-full">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              We're sorry, but an error occurred while rendering this page.
            </p>
            
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-auto max-h-40">
              <p className="text-sm font-mono text-red-600 dark:text-red-400">
                {this.state.error?.toString() || 'Unknown error'}
              </p>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => window.location.href = '/'}
                className="bg-whatsapp-dark hover:bg-whatsapp-teal text-white py-2 px-6 rounded-lg font-medium transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;