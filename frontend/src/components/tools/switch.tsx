import { useState, useEffect } from 'react'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Switch({ checked, onChange }: SwitchProps) {
  const [isChecked, setIsChecked] = useState(checked)

  useEffect(() => {
    setIsChecked(checked)
  }, [checked])

  const toggle = () => {
    const newValue = !isChecked
    setIsChecked(newValue)
    onChange(newValue)
  }

  return (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-whatsapp-dark focus:ring-offset-2 ${
        isChecked ? 'bg-whatsapp-dark' : 'bg-gray-200'
      }`}
      onClick={toggle}
      aria-pressed={isChecked}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isChecked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}