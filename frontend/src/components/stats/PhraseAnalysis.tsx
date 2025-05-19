import React from 'react';

interface PhraseAnalysisProps {
  phraseAnalysis: {
    common_phrases: Array<{
      phrase: string;
      count: number;
      sentiment: number;
    }>;
    by_sender?: Record<
      string,
      Array<{
        phrase: string;
        count: number;
      }>
    >;
  };
}

const PhraseAnalysis: React.FC<PhraseAnalysisProps> = ({ phraseAnalysis }) => {
  if (!phraseAnalysis.common_phrases || phraseAnalysis.common_phrases.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <p>No phrase data available.</p>
      </div>
    );
  }

  // Get sentiment color class
  const getSentimentColorClass = (score: number) => {
    if (score >= 0.5) return 'bg-green-500';
    if (score >= 0.2) return 'bg-green-300';
    if (score >= -0.2) return 'bg-blue-300';
    if (score >= -0.5) return 'bg-orange-300';
    return 'bg-red-400';
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Phrase
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Count
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sentiment
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {phraseAnalysis.common_phrases.slice(0, 10).map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  "{item.phrase}"
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {item.count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${getSentimentColorClass(item.sentiment)} mr-2`}></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.sentiment.toFixed(2)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {phraseAnalysis.by_sender && Object.keys(phraseAnalysis.by_sender).length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(phraseAnalysis.by_sender).map(([sender, phrases]) => (
            <div key={sender} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-800 dark:text-white mb-3">
                {sender}'s Favorite Phrases
              </h4>
              <ul className="space-y-2">
                {phrases.slice(0, 5).map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-300">
                    "{item.phrase}" <span className="text-gray-400">({item.count} times)</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhraseAnalysis;