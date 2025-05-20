import React from 'react';

interface ButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  type = 'button',
  icon,
  className = '',
  disabled = false,
  fullWidth = false,
  onClick,
  ...rest
}) => {
  // Determine classes based on variant, size, etc.
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-whatsapp-dark hover:bg-whatsapp-teal text-white';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white';
      case 'outline':
        return 'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-whatsapp-dark hover:bg-whatsapp-teal text-white';
    }
  };
  
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-xs py-1.5 px-3';
      case 'medium':
        return 'text-sm py-2 px-4';
      case 'large':
        return 'text-base py-2.5 px-5';
      default:
        return 'text-sm py-2 px-4';
    }
  };
  
  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer';
  
  const widthClasses = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${disabledClasses}
        ${widthClasses}
        ${className}
        rounded-md font-medium transition-colors duration-200 flex items-center justify-center
      `}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {icon && <span className={`${children ? 'mr-2' : ''}`}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;