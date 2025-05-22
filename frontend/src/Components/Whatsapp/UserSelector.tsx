import React, { useState, useRef, useEffect } from 'react';

interface UserSelectorProps {
  participants: string[];
  value: string;
  onChange: (participant: string) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ participants, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  // Handle participant selection
  const handleSelect = (participant: string) => {
    onChange(participant);
    setIsOpen(false);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-whatsapp-dark dark:hover:text-whatsapp-light"
      >
        <span className="font-medium">{value}</span>
        <svg className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
          {participants.map((participant) => (
            <button
              key={participant}
              onClick={() => handleSelect(participant)}
              className={`
                block w-full text-left px-4 py-2 text-sm
                ${participant === value
                  ? 'bg-whatsapp-dark/10 dark:bg-whatsapp-light/10 text-whatsapp-dark dark:text-whatsapp-light font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
              `}
            >
              {participant}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSelector;