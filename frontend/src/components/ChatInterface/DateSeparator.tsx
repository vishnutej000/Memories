import React from 'react';

interface DateSeparatorProps {
  date: Date;
  sentiment?: {
    score: number;
    label: 'positive' | 'neutral' | 'negative';
  };
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ date, sentiment }) => {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);

  const getSentimentEmoji = () => {
    if (!sentiment) return '';
    
    if (sentiment.label === 'positive') return '😊';
    if (sentiment.label === 'negative') return '😔';
    return '😐';
  };

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-gray-200 rounded-full px-4 py-1 text-xs text-gray-600 flex items-center">
        <span>{formattedDate}</span>
        {sentiment && (
          <span className="ml-2" title={`Sentiment: ${sentiment.label} (${sentiment.score.toFixed(2)})`}>
            {getSentimentEmoji()}
          </span>
        )}
      </div>
    </div>
  );
};

export default DateSeparator;