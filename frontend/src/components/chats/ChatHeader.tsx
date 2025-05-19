import React from 'react';
import { format, parseISO } from 'date-fns';
import { BsArrowLeft, BsThreeDotsVertical } from 'react-icons/bs';

interface ChatHeaderProps {
  title: string;
  messageCount: number;
  dateRange: {
    start: string;
    end: string;
  };
  onBack: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, messageCount, dateRange, onBack }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center">
      <button
        onClick={onBack}
        className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
      >
        <BsArrowLeft className="text-xl" />
      </button>
      
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white truncate">{title}</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {messageCount} messages · {format(parseISO(dateRange.start), 'MMM d, yyyy')} to {format(parseISO(dateRange.end), 'MMM d, yyyy')}
        </p>
      </div>
      
      <div className="relative">
        <button
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <BsThreeDotsVertical />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;