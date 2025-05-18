import { ReactNode, useState } from 'react'

interface TooltipProps {
  children: ReactNode
  content: string
  position?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
}

export function Tooltip({
  children,
  content,
  position = 'right',
  delay = 300
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  let timeout: NodeJS.Timeout

  const showTooltip = () => {
    timeout = setTimeout(() => setVisible(true), delay)
  }

  const hideTooltip = () => {
    clearTimeout(timeout)
    setVisible(false)
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2'
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      {visible && (
        <div
          className={`absolute ${positionClasses[position]} px-3 py-1.5 text-sm font-medium text-white bg-gray-800 rounded-md shadow-lg whitespace-nowrap z-50`}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-800 transform rotate-45 ${
              position === 'top' && 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'
            } ${
              position === 'right' && 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2'
            } ${
              position === 'bottom' && 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
            } ${
              position === 'left' && 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  )
}