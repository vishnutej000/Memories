import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { format, parseISO, subMonths, subDays } from 'date-fns';
import { useSentiment } from '../../hooks/useSentiment';
import LoadingSpinner from '../common/LoadingSpinner';

// Register Chart.js components
Chart.register(...registerables);

interface SentimentChartProps {
  chatId: string;
  timeRange: 'week' | 'month' | '3month' | '6month' | 'year' | 'all';
}

const SentimentChart: React.FC<SentimentChartProps> = ({ chatId, timeRange }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const { 
    dailySentiment, 
    loading, 
    error,
    fetchSentimentByDateRange
  } = useSentiment(chatId);
  
  // Update date range when timeRange changes
  useEffect(() => {
    const end = new Date();
    let start: Date;
    
    switch (timeRange) {
      case 'week':
        start = subDays(end, 7);
        break;
      case '3month':
        start = subMonths(end, 3);
        break;
      case '6month':
        start = subMonths(end, 6);
        break;
      case 'year':
        start = subMonths(end, 12);
        break;
      case 'all':
        // For 'all', we'll use a very old date and let the backend limit it
        start = new Date(2000, 0, 1);
        break;
      case 'month':
      default:
        start = subMonths(end, 1);
        break;
    }
    
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];
    
    setStartDate(startDateStr);
    setEndDate(endDateStr);
    
    fetchSentimentByDateRange(startDateStr, endDateStr);
  }, [timeRange, fetchSentimentByDateRange]);
  
  const getEmotionLabel = (score: number): string => {
    if (score >= 0.5) return 'Very Happy';
    if (score >= 0.2) return 'Happy';
    if (score >= -0.2) return 'Neutral';
    if (score >= -0.5) return 'Sad';
    return 'Very Sad';
  };
  
  const getEmotionColor = (score: number): string => {
    if (score >= 0.5) return 'rgba(34, 197, 94, 0.7)';  // Green
    if (score >= 0.2) return 'rgba(74, 222, 128, 0.7)'; // Light green
    if (score >= -0.2) return 'rgba(59, 130, 246, 0.7)'; // Blue
    if (score >= -0.5) return 'rgba(249, 115, 22, 0.7)'; // Orange
    return 'rgba(239, 68, 68, 0.7)'; // Red
  };
  
  const chartData = {
    labels: dailySentiment.map(item => format(parseISO(item.date), 'MMM d')),
    datasets: [
      {
        label: 'Sentiment Score',
        data: dailySentiment.map(item => item.avg_score),
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: dailySentiment.map(item => getEmotionColor(item.avg_score)),
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
        tension: 0.4,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const score = context.raw;
            return `Mood: ${getEmotionLabel(score)} (${score.toFixed(2)})`;
          },
          afterLabel: (context: any) => {
            const index = context.dataIndex;
            const data = dailySentiment[index];
            if (!data) return null;
            
            const messageCount = `Messages: ${data.message_count}`;
            return [messageCount];
          }
        }
      }
    },
    scales: {
      y: {
        min: -1,
        max: 1,
        ticks: {
          callback: (value: number) => getEmotionLabel(value),
        },
        grid: {
          color: 'rgba(160, 174, 192, 0.1)',
        }
      },
      x: {
        grid: {
          color: 'rgba(160, 174, 192, 0.1)',
        }
      }
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        <p>{error}</p>
      </div>
    );
  }

  if (dailySentiment.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <p>No sentiment data available for the selected time range.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
        Emotional Journey
      </h3>
      
      <div className="h-80">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      {dailySentiment.length > 0 && (
        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-800 dark:text-white mb-3">
            Emotional Highlights
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dailySentiment
              .filter(day => day.top_positive_message || day.top_negative_message)
              .slice(0, 4)
              .map((day, index) => (
                <div 
                  key={index} 
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {format(parseISO(day.date), 'MMMM d, yyyy')}
                  </div>
                  
                  {day.top_positive_message && (
                    <div className="mb-2">
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-xs text-green-500">Most Positive</span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 mt-1 text-sm truncate">
                        "{day.top_positive_message.content}"
                      </p>
                    </div>
                  )}
                  
                  {day.top_negative_message && (
                    <div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        <span className="text-xs text-red-500">Most Negative</span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 mt-1 text-sm truncate">
                        "{day.top_negative_message.content}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SentimentChart;