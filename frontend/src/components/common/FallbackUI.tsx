import React from 'react';
import { Link } from 'react-router-dom';
import { BsExclamationTriangle, BsArrowClockwise, BsWrench, BsTools } from 'react-icons/bs';

interface FallbackUIProps {
  title?: string;
  message: string;
  retryAction?: () => void;
  setupAction?: () => void;
  showSetupGuide?: boolean;
}

const FallbackUI: React.FC<FallbackUIProps> = ({ 
  title = "Connection Error", 
  message,
  retryAction,
  setupAction,
  showSetupGuide = false
}) => {
  return (
    <div className="max-w-lg mx-auto my-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex items-center justify-center mb-6">
        <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
          <BsExclamationTriangle className="text-3xl text-amber-500" />
        </div>
      </div>
      
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white text-center mb-4">
        {title}
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
        {message}
      </p>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        {retryAction && (
          <button 
            onClick={retryAction}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <BsArrowClockwise className="mr-2" />
            Try Again
          </button>
        )}
        
        <Link 
          to="/api-debug"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 dark:text-primary-200 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <BsTools className="mr-2" />
          Diagnose API Issues
        </Link>
      </div>
      
      {showSetupGuide && (
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <h3 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300">
            Backend Setup Quick Guide
          </h3>
          <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <li>Make sure your backend server is running at <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{import.meta.env.VITE_API_URL || 'http://localhost:8000'}</code></li>
            <li>Check if your API endpoints match the ones expected by the frontend</li>
            <li>Verify that CORS is properly configured on your backend</li>
            <li>Ensure your database connection is working</li>
            <li>Check your backend logs for any errors</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default FallbackUI;