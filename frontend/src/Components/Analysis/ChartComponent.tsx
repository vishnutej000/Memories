import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  PieController,
  ArcElement,
  DoughnutController,
  TimeScale,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { useTheme } from '../contexts/ThemeContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  PieController,
  ArcElement,
  DoughnutController,
  TimeScale,
  Tooltip,
  Legend
);

interface ChartComponentProps {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  data: ChartData<any>;
  options?: ChartOptions<any>;
  height?: number;
}

const ChartComponent: React.FC<ChartComponentProps> = ({
  type,
  data,
  options = {},
  height = 300
}) => {
  const { darkMode } = useTheme();
  
  // Set up default options with light/dark mode support
  const defaultOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    color: darkMode ? '#E5E7EB' : '#4B5563',
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? '#E5E7EB' : '#4B5563',
          font: {
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
          }
        }
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: darkMode ? '#F3F4F6' : '#1F2937',
        bodyColor: darkMode ? '#D1D5DB' : '#4B5563',
        borderColor: darkMode ? '#4B5563' : '#E5E7EB',
        borderWidth: 1
      }
    },
    scales: type !== 'pie' && type !== 'doughnut' ? {
      x: {
        ticks: {
          color: darkMode ? '#9CA3AF' : '#6B7280'
        },
        grid: {
          color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.6)'
        }
      },
      y: {
        ticks: {
          color: darkMode ? '#9CA3AF' : '#6B7280'
        },
        grid: {
          color: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.6)'
        }
      }
    } : undefined
  };
  
  // Merge default options with provided options
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins
    },
    scales: {
      ...defaultOptions.scales,
      ...options.scales
    }
  };
  
  return (
    <div style={{ height: `${height}px` }}>
      <Chart
        type={type}
        data={data}
        options={mergedOptions}
      />
    </div>
  );
};

export default ChartComponent;