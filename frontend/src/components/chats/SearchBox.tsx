import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../hooks/usechat';
import { ChatMessage } from '../../types/chat.types';
import { BsSearch, BsX, BsChevronUp, BsChevronDown } from 'react-icons/bs';
import { format, parseISO } from 'date-fns';

interface SearchBoxProps {
  chatId: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({ chatId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChatMessage[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const { searchMessages } = useChat(chatId);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultContainerRef = useRef<HTMLDivElement>(null);
  
  // Focus input when search box opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Scroll selected result into view
  useEffect(() => {
    if (selectedResultIndex >= 0 && resultContainerRef.current) {
      const selectedElement = resultContainerRef.current.children[selectedResultIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedResultIndex]);
  
  // Handle search
  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const { messages } = await searchMessages(query);
      setResults(messages);
      setSelectedResultIndex(messages.length > 0 ? 0 : -1);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      setSelectedResultIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length > 0) {
      e.preventDefault();
      setSelectedResultIndex(prev => (prev - 1 + results.length) % results.length);
    }
  };
  
  // Navigate to next result
  const goToNextResult = () => {
    if (results.length > 0) {
      setSelectedResultIndex(prev => (prev + 1) % results.length);
    }
  };
  
  // Navigate to previous result
  const goToPrevResult = () => {
    if (results.length > 0) {
      setSelectedResultIndex(prev => (prev - 1 + results.length) % results.length);
    }
  };
  
  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSelectedResultIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Toggle search box
  const toggleSearch = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      clearSearch();
    }
  };
  
  // Highlight matching text
  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };
  
  return (
    <div className="relative">
      {/* Search Toggle Button */}
      <button
        onClick={toggleSearch}
        className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <BsSearch className="mr-2" /> Search
      </button>
      
      {/* Search Box Overlay */}
      {isOpen && (
        <div className="absolute top-0 left-0 w-full">
          <div className="bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden p-2">
            <div className="flex items-center">
              <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-700 rounded-md px-3 py-2">
                <BsSearch className="text-gray-500 dark:text-gray-400 mr-2" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Search messages..."
                  className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                {query && (
                  <button
                    onClick={clearSearch}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <BsX />
                  </button>
                )}
              </div>
              
              <button
                onClick={toggleSearch}
                className="ml-2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <BsX />
              </button>
            </div>
            
            {isSearching ? (
              <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {results.length} {results.length === 1 ? 'result' : 'results'}
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={goToPrevResult}
                      className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      disabled={results.length === 0}
                    >
                      <BsChevronUp />
                    </button>
                    <button
                      onClick={goToNextResult}
                      className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ml-1"
                      disabled={results.length === 0}
                    >
                      <BsChevronDown />
                    </button>
                  </div>
                </div>
                
                <div 
                  ref={resultContainerRef}
                  className="max-h-96 overflow-y-auto"
                >
                  {results.map((message, index) => (
                    <div
                      key={message.id}
                      className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                        index === selectedResultIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => setSelectedResultIndex(index)}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-gray-800 dark:text-white">
                          {message.sender}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(parseISO(`${message.date}T${message.time}`), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <div 
                        className="text-gray-600 dark:text-gray-300 mt-1"
                        dangerouslySetInnerHTML={{
                          __html: highlightMatch(message.content, query)
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              </>
            ) : query.trim() ? (
              <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                No results found for "{query}"
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                Type to search messages
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBox;