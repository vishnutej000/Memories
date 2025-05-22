import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white' | 'gray';
  text?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  text
}) => {
  // Determine size classes
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4';
      case 'medium':
        return 'w-8 h-8';
      case 'large':
        return 'w-12 h-12';
      default:
        return 'w-8 h-8';
    }
  };
  
  // Determine color classes
  const getColorClass = () => {
    switch (color) {
      case 'primary':
        return 'text-whatsapp-dark dark:text-whatsapp-light';
      case 'white':
        return 'text-white';
      case 'gray':
        return 'text-gray-500 dark:text-gray-400';
      default:
        return 'text-whatsapp-dark dark:text-whatsapp-light';
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center">
      <svg 
        className={`animate-spin ${getSizeClass()} ${getColorClass()}`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        ></circle>
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      
      {text && (
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{text}</p>
      )}
    </div>
  );
};

export default Spinner;