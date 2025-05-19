import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useSentiment } from '../hooks/useSentiment';
import SentimentChart from '../components/stats/SentimentChart';
import EmojiCloud from '../components/stats/EmojiCloud';
import PhraseAnalysis from '../components/stats/PhraseAnalysis';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorMessage from '../components/common/ErrorMessage';

const StatsPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { metadata, loading: chatLoading, error: chatError } = useChat(chatId);
  const { 
    overallSentiment, 
    emojiAnalysis,
    phraseAnalysis,
    loading: sentimentLoading, 
    error: sentimentError,
    fetchOverallSentiment,
    fetchEmojiAnalysis,
    fetchPhraseAnalysis
  } = useSentiment(chatId || '');
  
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3month' | '6month' | 'year' | 'all'>('month');
  
  useEffect(() => {
    if (chatId) {
      fetchOverallSentiment();
      fetchEmojiAnalysis();
      fetchPhraseAnalysis();
    }
  }, [chatId, fetchOverallSentiment, fetchEmojiAnalysis, fetchPhraseAnalysis]);
  
  if (!chatId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            No chat selected
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Please select a chat from the sidebar or upload a new chat.
          </p>
        </div>
      </div>
    );
  }
  
  if (chatLoading || sentimentLoading) {
    return <LoadingScreen message="Analyzing sentiment data..." />;
  }
  
  if (chatError) {
    return <ErrorMessage message={chatError} />;
  }
  
  if (sentimentError) {
    return <ErrorMessage message={sentimentError} />;
  }
  
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto py-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
            Chat Insights
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Explore sentiment analysis and patterns in your conversation
          </p>
          
          <div className="mt-4">
            <div className="inline-block">
              <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time Range:
              </label>
              <select
                id="timeRange"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="3month">Last 3 Months</option>
                <option value="6month">Last 6 Months</option>
                <option value="year">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sentiment Chart */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <SentimentChart chatId={chatId} timeRange={timeRange} />
          </div>
          
          {/* Emoji Analysis */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Emoji Usage
            </h3>
            {emojiAnalysis ? (
              <EmojiCloud emojiAnalysis={emojiAnalysis} />
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500 dark:text-gray-400">
                  No emoji data available
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Common Phrases */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Common Phrases
          </h3>
          {phraseAnalysis ? (
            <PhraseAnalysis phraseAnalysis={phraseAnalysis} />
          ) : (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500 dark:text-gray-400">
                No phrase data available
              </p>
            </div>
          )}
        </div>
        
        {/* Sender Comparison */}
        {overallSentiment && overallSentiment.sender_sentiment && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Sender Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Person
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Messages
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Avg. Sentiment
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sentiment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(overallSentiment.sender_sentiment).map(([sender, data]) => (
                    <tr key={sender}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {sender}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {data.message_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {data.avg_score.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              data.avg_score > 0.2 ? 'bg-green-500' : 
                              data.avg_score > -0.2 ? 'bg-blue-500' : 'bg-red-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, Math.max(0, (data.avg_score + 1) * 50))}%`,
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;