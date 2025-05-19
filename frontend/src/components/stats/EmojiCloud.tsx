import React from 'react';
import { EmojiAnalysis } from '../../types/sentiment.types';

interface EmojiCloudProps {
  emojiAnalysis: EmojiAnalysis;
}

const EmojiCloud: React.FC<EmojiCloudProps> = ({ emojiAnalysis }) => {
  if (!emojiAnalysis.most_used || emojiAnalysis.most_used.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <p>No emoji data available.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
        {emojiAnalysis.most_used.slice(0, 20).map((item, index) => {
          // Calculate size based on percentage (min 1rem, max 3rem)
          const size = 1 + (item.percentage / 100) * 2;
          
          return (
            <div 
              key={index} 
              style={{ fontSize: `${size}rem` }}
              className="transition-transform hover:scale-110"
              title={`${item.emoji}: ${item.count} times (${item.percentage.toFixed(1)}%)`}
            >
              {item.emoji}
            </div>
          );
        })}
      </div>
      
      <div className="mt-6">
        <h4 className="text-md font-medium text-gray-800 dark:text-white mb-3">
          Emoji by Sentiment
        </h4>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h5 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
              Positive
            </h5>
            <div className="flex flex-wrap gap-2">
              {emojiAnalysis.by_sentiment.positive.slice(0, 10).map((emoji, index) => (
                <span key={index} className="text-lg">{emoji}</span>
              ))}
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
              Neutral
            </h5>
            <div className="flex flex-wrap gap-2">
              {emojiAnalysis.by_sentiment.neutral.slice(0, 10).map((emoji, index) => (
                <span key={index} className="text-lg">{emoji}</span>
              ))}
            </div>
          </div>
          
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h5 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
              Negative
            </h5>
            <div className="flex flex-wrap gap-2">
              {emojiAnalysis.by_sentiment.negative.slice(0, 10).map((emoji, index) => (
                <span key={index} className="text-lg">{emoji}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmojiCloud;