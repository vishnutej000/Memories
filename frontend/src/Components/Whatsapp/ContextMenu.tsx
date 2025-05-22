import React, { useEffect, useRef } from 'react';

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  xPos: number;
  yPos: number;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ items, xPos, yPos, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Adjust menu position to ensure it's within viewport
  const adjustedPosition = getAdjustedPosition(xPos, yPos);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Handle item click
  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      onClose();
    }
  };
  
  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden animate-fade-in"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        minWidth: '180px'
      }}
    >
      <ul className="py-1 text-sm">
        {items.map((item, index) => (
          <li key={index}>
            <button
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={`
                w-full px-4 py-2 text-left flex items-center
                ${item.disabled
                  ? 'opacity-50 cursor-not-allowed text-gray-500 dark:text-gray-400'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}
              `}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Helper function to adjust menu position to stay within viewport
function getAdjustedPosition(xPos: number, yPos: number): { x: number; y: number } {
  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Assume menu dimensions (these could be measured or estimated)
  const menuWidth = 180;
  const menuHeight = 150;
  
  // Adjust x-position if menu would overflow right edge
  let adjustedX = xPos;
  if (xPos + menuWidth > viewportWidth) {
    adjustedX = xPos - menuWidth;
  }
  
  // Adjust y-position if menu would overflow bottom edge
  let adjustedY = yPos;
  if (yPos + menuHeight > viewportHeight) {
    adjustedY = yPos - menuHeight;
  }
  
  // Ensure menu doesn't go off-screen to the left or top
  adjustedX = Math.max(5, adjustedX);
  adjustedY = Math.max(5, adjustedY);
  
  return { x: adjustedX, y: adjustedY };
}

export default ContextMenu;