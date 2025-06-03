import React, { useState, useMemo, memo } from 'react';
import { useDebounce, useMemoizedCallback } from '../../Hooks/usePerformance';
import { ChatMessage } from '../../types';

interface OptimizedSearchProps {
  messages: ChatMessage[];
  onResults: (results: ChatMessage[]) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

const OptimizedSearch: React.FC<OptimizedSearchProps> = memo(({
  messages,
  onResults,
  placeholder = "Search messages...",
  className = "",
  debounceMs = 300
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // Memoized search function
  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return messages;
    }

    const lowercaseQuery = debouncedSearchTerm.toLowerCase();
    const terms = lowercaseQuery.split(' ').filter(term => term.length > 0);

    return messages.filter(message => {
      const content = message.content.toLowerCase();
      const sender = message.sender.toLowerCase();

      // Check if all terms are found in either content or sender
      return terms.every(term => 
        content.includes(term) || sender.includes(term)
      );
    });
  }, [messages, debouncedSearchTerm]);

  // Notify parent of results when they change
  React.useEffect(() => {
    onResults(searchResults);
  }, [searchResults, onResults]);

  const handleInputChange = useMemoizedCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleClear = useMemoizedCallback(() => {
    setSearchTerm('');
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-dark focus:border-whatsapp-dark dark:bg-gray-700 dark:text-white"
        />
        
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Clear button */}
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg
              className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Results counter */}
      {debouncedSearchTerm && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
        </div>
      )}
    </div>
  );
});

OptimizedSearch.displayName = 'OptimizedSearch';

export default OptimizedSearch;
