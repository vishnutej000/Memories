import React from 'react';
import { useChat } from '../../hooks/usechat';
import { BsWifi, BsWifiOff, BsArrowClockwise } from 'react-icons/bs';

const ConnectionStatus: React.FC = () => {
  const { apiConnected, error, isLoading, retryConnection } = useChat();
  
  if (apiConnected && !error) {
    return null; // Don't show anything if connection is good
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-center">
          {apiConnected ? (
            <BsWifi className="text-green-500 text-xl mr-2" />
          ) : (
            <BsWifiOff className="text-red-500 text-xl mr-2" />
          )}
          
          <div className="flex-1">
            <h3 className={`font-medium ${apiConnected ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {apiConnected ? 'Connected' : 'Connection Issue'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {error || 'Cannot connect to the backend server. Please check if your backend is running.'}
            </p>
          </div>
          
          <button
            onClick={retryConnection}
            disabled={isLoading}
            className="ml-2 p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full disabled:opacity-50"
            title="Retry connection"
          >
            <BsArrowClockwise className={`text-xl ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;