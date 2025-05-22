import React, { useRef, useEffect } from 'react';
import Button from '../UI/Button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  autofocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  autofocus = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto focus the input when the component mounts
  useEffect(() => {
    if (autofocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autofocus]);
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };
  
  return (
    <div className="relative flex items-center">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="block w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-whatsapp-dark focus:border-whatsapp-dark dark:bg-gray-700 dark:text-white"
      />
      
      <div className="absolute inset-y-0 right-0 flex items-center pr-2">
        <Button
          onClick={onSearch}
          variant="primary"
          size="small"
          disabled={value.trim().length === 0}
        >
          Search
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;