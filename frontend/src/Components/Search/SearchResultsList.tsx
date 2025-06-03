import React from 'react';
import { ChatMessage } from '../../types';
import Spinner from '../UI/Spinner';
import { formatMessagePreview } from '../../utils/messageUtils';
import { formatDateTime } from '../../utils/dateUtils';

interface SearchResultsListProps {
  results: ChatMessage[];
  isLoading: boolean;
  selectedIndex: number;
  onSelect: (message: ChatMessage) => void;
  onClose: () => void;
}

const SearchResultsList: React.FC<SearchResultsListProps> = ({
  results,
  isLoading,
  selectedIndex,
  onSelect,
  onClose
}) => {
  // Handle click outside
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length > 0) {
        const newIndex = selectedIndex < results.length - 1 ? selectedIndex + 1 : 0;
        onSelect(results[newIndex]);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length > 0) {
        const newIndex = selectedIndex > 0 ? selectedIndex - 1 : results.length - 1;
        onSelect(results[newIndex]);
      }
    } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < results.length) {
      e.preventDefault();
      onSelect(results[selectedIndex]);
      onClose();
    }
  };
  
  // If loading, show spinner
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-md p-6">
        <div className="flex flex-col items-center justify-center py-6">
          <Spinner size="medium" text="Searching..." />
        </div>
      </div>
    );
  }
  
  // If no results, show message
  if (results.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-md p-6">
        <div className="flex flex-col items-center justify-center py-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-gray-700 dark:text-gray-300 text-lg font-medium mb-1">No results found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Try different keywords or check your spelling
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-md max-h-96 overflow-y-auto"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          Found <span className="font-medium text-gray-800 dark:text-white">{results.length}</span> results
        </div>
      </div>
      
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {results.map((message, index) => (
          <li 
            key={message.id}
            className={`
              p-3 cursor-pointer transition-colors
              ${selectedIndex === index
                ? 'bg-whatsapp-light/10 dark:bg-whatsapp-dark/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
            onClick={() => {
              onSelect(message);
              onClose();
            }}
          >
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-800 dark:text-white">
                {message.sender}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDateTime(message.timestamp)}
              </span>
            </div>
            
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {message.isDeleted
                ? <span className="italic text-gray-500 dark:text-gray-400">This message was deleted</span>
                : message.isMedia
                ? <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Media
                  </span>
                : formatMessagePreview(message, 150)
              }
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchResultsList;