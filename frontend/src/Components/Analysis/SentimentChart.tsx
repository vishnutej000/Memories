import React, { useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Chart from 'chart.js/auto';

interface SentimentData {
  date: string;
  average: number;
  messages: number;
}

interface SentimentChartProps {
  data: SentimentData[];
  height?: number;
}

const SentimentChart: React.FC<SentimentChartProps> = ({ data, height = 300 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const { darkMode } = useTheme();
  
  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;
    
    // Destroy previous chart if exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Prepare data
    const chartData = {
      labels: data.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString();
      }),
      datasets: [
        {
          label: 'Average Sentiment',
          data: data.map(d => d.average),
          borderColor: darkMode ? '#25D366' : '#075E54',
          backgroundColor: '#25D36622',
          fill: true,
          pointBackgroundColor: darkMode ? '#34B7F1' : '#128C7E',
          pointBorderColor: darkMode ? '#34B7F1' : '#128C7E',
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3
        }
      ]
    };
    
    // Chart configuration
    const config = {
      type: 'line' as const,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              color: darkMode ? 'rgba(200, 200, 200, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: darkMode ? '#aaa' : '#666',
              maxTicksLimit: 10,
              maxRotation: 45,
              minRotation: 0
            }
          },
          y: {
            min: -1,
            max: 1,
            grid: {
              color: darkMode ? 'rgba(200, 200, 200, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: darkMode ? '#aaa' : '#666',
              callback: function(value: any) {
                if (value === 1) return 'Very Positive';
                if (value === 0.5) return 'Positive';
                if (value === 0) return 'Neutral';
                if (value === -0.5) return 'Negative';
                if (value === -1) return 'Very Negative';
                return '';
              }
            }
          }
        },
        plugins: {
          tooltip: {
            backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
            titleColor: darkMode ? '#fff' : '#000',
            bodyColor: darkMode ? '#eee' : '#333',
            borderColor: darkMode ? '#555' : '#ddd',
            borderWidth: 1,
            callbacks: {
              label: function(context: any) {
                const dataPoint = data[context.dataIndex];
                let sentiment;
                
                if (dataPoint.average >= 0.6) sentiment = 'Very Positive';
                else if (dataPoint.average >= 0.2) sentiment = 'Positive';
                else if (dataPoint.average >= -0.2) sentiment = 'Neutral';
                else if (dataPoint.average >= -0.6) sentiment = 'Negative';
                else sentiment = 'Very Negative';
                
                return [
                  `Sentiment: ${sentiment} (${dataPoint.average.toFixed(2)})`,
                  `Messages: ${dataPoint.messages}`
                ];
              }
            }
          },
          legend: {
            labels: {
              color: darkMode ? '#eee' : '#333'
            }
          }
        }
      }
    };
    
    // Create chart
    chartRef.current = new Chart(ctx, config);
    
    // Cleanup on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, darkMode]);
  
  return (
    <div style={{ height: height + 'px', width: '100%' }}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default SentimentChart;