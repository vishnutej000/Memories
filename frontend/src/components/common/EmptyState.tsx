import React from 'react';

interface EmptyStateProps {
  message: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message, 
  description, 
  action,
  icon
}) => {
  return (
    <div className="text-center p-8">
      {icon && <div className="mx-auto mb-4 text-gray-400 dark:text-gray-500">{icon}</div>}
      
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
        {message}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;