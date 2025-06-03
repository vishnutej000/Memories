import React, { useState, useEffect } from 'react';
import HybridStorageService from '../../services/hybridStorageService';

interface ConnectionStatusProps {
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const connected = await HybridStorageService.checkBackendConnection();
      setIsConnected(connected);
      setLastChecked(new Date());
    } catch (error) {
      setIsConnected(false);
      console.warn('Connection check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRetryConnection = () => {
    checkConnection();
  };

  const getStatusColor = () => {
    if (isChecking) return 'text-yellow-600 dark:text-yellow-400';
    return isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    
    if (isConnected) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    );
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking connection...';
    return isConnected ? 'Backend Connected' : 'Backend Offline';
  };

  const getDescription = () => {
    if (isChecking) return 'Verifying backend connection';
    if (isConnected) {
      return 'Full features available including analytics and export';
    }
    return 'Using local storage only. Some features may be limited.';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      
      {!isConnected && !isChecking && (
        <button
          onClick={handleRetryConnection}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Retry
        </button>
      )}
      
      {lastChecked && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Last checked: {lastChecked.toLocaleTimeString()}
        </span>
      )}
      
      {/* Tooltip */}
      <div className="relative group">
        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {getDescription()}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;
