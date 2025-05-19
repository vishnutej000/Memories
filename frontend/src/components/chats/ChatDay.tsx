import React from 'react';
import { format, parseISO } from 'date-fns';

interface ChatDayProps {
  date: string;
}

const ChatDay: React.FC<ChatDayProps> = ({ date }) => {
  const formattedDate = format(parseISO(date), 'EEEE, MMMM d, yyyy');
  
  return (
    <div className="date-header my-2">
      <div className="inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-xs font-medium">
        {formattedDate}
      </div>
    </div>
  );
};

export default ChatDay;