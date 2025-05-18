import { ReactNode } from 'react'
import { Tooltip } from '../ui/Tooltip' // Create this component for tooltips

interface NavButtonProps {
  icon: ReactNode | string
  label: string
  active?: boolean
  onClick: () => void
  badge?: number
  customClass?: string
}

export function NavButton({
  icon,
  label,
  active = false,
  onClick,
  badge,
  customClass = ''
}: NavButtonProps) {
  return (
    <Tooltip content={label} position="right">
      <button
        onClick={onClick}
        className={`relative p-3 rounded-full transition-all duration-200 ${customClass} ${
          active
            ? 'bg-whatsapp-dark text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
      >
        {/* Icon - can be either string emoji or React component */}
        <span className="text-xl">
          {typeof icon === 'string' ? icon : icon}
        </span>

        {/* Notification badge */}
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}

        {/* Active indicator */}
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-md" />
        )}
      </button>
    </Tooltip>
  )
}