import React, { ReactNode, useEffect, useState } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({ 
  children, 
  fallback, 
  onError 
}) => {
  const [asyncError, setAsyncError] = useState<Error | null>(null);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(
        event.reason?.message || 'Unhandled promise rejection'
      );
      setAsyncError(error);
      onError?.(error);
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      const error = new Error(event.message || 'Unhandled error');
      setAsyncError(error);
      onError?.(error);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [onError]);

  if (asyncError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
            Network or Service Error
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
            A network or service error occurred. Please check your connection and try again.
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setAsyncError(null)}
              className="flex-1 bg-whatsapp-teal hover:bg-whatsapp-dark text-white py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-whatsapp-teal focus:ring-offset-2"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
};

export default AsyncErrorBoundary;
