import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  className = ''
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-10 h-10';
      case 'md':
      default: return 'w-6 h-6';
    }
  };
  
  return (
    <div className={`${className}`}>
      <div className={`${getSizeClass()} border-2 border-t-primary-500 border-r-primary-500 border-b-primary-200 border-l-primary-200 rounded-full animate-spin`}></div>
    </div>
  );
};

export default LoadingSpinner;