import React from 'react';

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}

const NavButton: React.FC<NavButtonProps> = ({ 
  icon, 
  label, 
  isActive, 
  onClick,
  badge 
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center w-full py-3
        transition-colors duration-200 ease-in-out relative
        ${isActive 
          ? 'text-whatsapp-teal border-b-2 border-whatsapp-teal' 
          : 'text-gray-500 hover:text-gray-700'
        }
      `}
      title={label}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </div>
        )}
      </div>
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
};

export default NavButton;