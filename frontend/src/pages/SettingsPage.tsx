import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { BsTrash, BsCheck2, BsX, BsMoon, BsSun, BsShield, BsGear } from 'react-icons/bs';

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const db = useIndexedDB();
  
  const [clearingData, setClearingData] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [dataCleared, setDataCleared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Toggle between light and dark mode
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };
  
  // Clear all local data
  const handleClearAllData = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    
    try {
      setClearingData(true);
      setError(null);
      
      // Clear all IndexedDB stores
      await db.clearStore('chat_metadata');
      await db.clearStore('messages');
      await db.clearStore('audio_notes');
      await db.clearStore('diary_entries');
      await db.clearStore('date_ranges');
      
      // Clear local storage as well
      localStorage.clear();
      
      setDataCleared(true);
      setConfirmClear(false);
    } catch (err: any) {
      console.error('Error clearing data:', err);
      setError(err.message || 'Failed to clear data');
    } finally {
      setClearingData(false);
    }
  };
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Customize your WhatsApp Memory Vault experience
          </p>
        </div>
        
        {/* User Profile */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-6">
            <div className="h-12 w-12 rounded-full bg-primary-500 text-white flex items-center justify-center text-xl font-semibold">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white">
                {user?.username}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {user?.email || 'No email provided'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Log Out
          </button>
        </div>
        
        {/* Appearance Settings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <BsGear className="text-xl text-gray-500 dark:text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-800 dark:text-white">
              Appearance
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <label className="text-gray-700 dark:text-gray-300 mr-4">
                Theme:
              </label>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex items-center px-3 py-1 rounded ${
                    theme === 'light' 
                      ? 'bg-white dark:bg-gray-600 shadow' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <BsSun className="mr-1" /> Light
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex items-center px-3 py-1 rounded ${
                    theme === 'dark' 
                      ? 'bg-white dark:bg-gray-600 shadow' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <BsMoon className="mr-1" /> Dark
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Privacy & Data */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <BsShield className="text-xl text-gray-500 dark:text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-800 dark:text-white">
              Privacy & Data
            </h2>
          </div>
          
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            WhatsApp Memory Vault stores all your data locally on your device. No data is sent to servers.
          </p>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <h3 className="text-md font-medium text-red-800 dark:text-red-300 mb-2">
              Danger Zone
            </h3>
            
            {dataCleared ? (
              <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-md mb-4">
                <div className="flex">
                  <BsCheck2 className="text-green-500 text-xl flex-shrink-0 mr-2" />
                  <p className="text-green-800 dark:text-green-200">
                    All data has been successfully cleared.
                  </p>
                </div>
              </div>
            ) : confirmClear ? (
              <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-md mb-4">
                <h4 className="text-red-800 dark:text-red-300 font-medium mb-2">
                  Are you absolutely sure?
                </h4>
                <p className="text-red-700 dark:text-red-200 text-sm mb-4">
                  This action cannot be undone. All your chats, diary entries, and voice notes will be permanently deleted.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded"
                  >
                    <BsX className="inline mr-1" /> Cancel
                  </button>
                  <button
                    onClick={handleClearAllData}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                    disabled={clearingData}
                  >
                    {clearingData ? 'Clearing...' : (
                      <>
                        <BsTrash className="inline mr-1" /> Yes, delete all my data
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleClearAllData}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={clearingData}
              >
                <BsTrash className="mr-2" />
                Clear All Data
              </button>
            )}
            
            {error && (
              <div className="mt-4 text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
        
        {/* About */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
            About
          </h2>
          
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            <p className="mb-2">WhatsApp Memory Vault v{import.meta.env.VITE_APP_VERSION || '1.0.0'}</p>
            <p className="mb-2">© 2025 vishnutej000. All rights reserved.</p>
            <p>
              A local-first, private, and secure way to explore your WhatsApp conversations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;