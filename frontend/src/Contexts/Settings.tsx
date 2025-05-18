import { useState } from 'react'
import { Switch } from '../components/tools/switch'

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [analytics, setAnalytics] = useState(true)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Dark Mode</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Switch between light and dark theme
              </p>
            </div>
            <Switch checked={darkMode} onChange={setDarkMode} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enable or disable notifications
              </p>
            </div>
            <Switch checked={notifications} onChange={setNotifications} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Analytics</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Allow anonymous usage analytics
              </p>
            </div>
            <Switch checked={analytics} onChange={setAnalytics} />
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Export Data</h3>
            <button className="w-full bg-whatsapp-dark text-white px-4 py-2 rounded hover:bg-whatsapp-darker transition">
              Export All Chat Data
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
          <button className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition">
            Cancel
          </button>
          <button className="px-4 py-2 bg-whatsapp-dark text-white rounded hover:bg-whatsapp-darker transition">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}