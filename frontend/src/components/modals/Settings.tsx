import React, { useState } from 'react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPDF: () => Promise<void>;
  onExportData: () => Promise<void>;
  onClearData: () => Promise<void>;
  settings: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    autoExport: boolean;
    privacyMode: boolean;
  };
  onUpdateSettings: (settings: Partial<SettingsProps['settings']>) => void;
}

const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  onExportPDF,
  onExportData,
  onClearData,
  settings,
  onUpdateSettings
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportType, setExportType] = useState<'pdf' | 'data' | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);
  
  if (!isOpen) return null;
  
  const handleExport = async (type: 'pdf' | 'data') => {
    try {
      setIsExporting(true);
      setExportType(type);
      
      if (type === 'pdf') {
        await onExportPDF();
      } else {
        await onExportData();
      }
    } catch (error) {
      console.error(`Error exporting ${type}:`, error);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };
  
  const handleClearData = async () => {
    try {
      await onClearData();
      setShowConfirmClear(false);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Settings
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Appearance */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">Appearance</h3>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => onUpdateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-whatsapp-teal focus:border-whatsapp-teal sm:text-sm rounded-md"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
            </div>
            
            {/* Privacy & Security */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">Privacy & Security</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Privacy Mode</span>
                    <p className="text-xs text-gray-500">Hide sensitive information when sharing screen</p>
                  </div>
                  <button
                    type="button"
                    className={`${
                      settings.privacyMode ? 'bg-whatsapp-teal' : 'bg-gray-200'
                    } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none`}
                    onClick={() => onUpdateSettings({ privacyMode: !settings.privacyMode })}
                  >
                    <span
                      className={`${
                        settings.privacyMode ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Notifications</span>
                    <p className="text-xs text-gray-500">Show desktop notifications for new imports</p>
                  </div>
                  <button
                    type="button"
                    className={`${
                      settings.notifications ? 'bg-whatsapp-teal' : 'bg-gray-200'
                    } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none`}
                    onClick={() => onUpdateSettings({ notifications: !settings.notifications })}
                  >
                    <span
                      className={`${
                        settings.notifications ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Auto Export</span>
                    <p className="text-xs text-gray-500">Periodically backup your diary entries</p>
                  </div>
                  <button
                    type="button"
                    className={`${
                      settings.autoExport ? 'bg-whatsapp-teal' : 'bg-gray-200'
                    } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none`}
                    onClick={() => onUpdateSettings({ autoExport: !settings.autoExport })}
                  >
                    <span
                      className={`${
                        settings.autoExport ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                    />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Data Management */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">Data Management</h3>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                >
                  {isExporting && exportType === 'pdf' ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  Export as PDF
                </button>
                
                <button
                  type="button"
                  onClick={() => handleExport('data')}
                  disabled={isExporting}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                >
                  {isExporting && exportType === 'data' ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  )}
                  Export All Data
                </button>
                
                {!showConfirmClear ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirmClear(true)}
                    className="w-full flex justify-center items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All Data
                  </button>
                ) : (
                  <div className="border border-red-300 rounded-md p-3 bg-red-50">
                    <p className="text-sm text-red-700 mb-3">
                      Are you sure? This will delete all your imported chats and diary entries permanently.
                    </p>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowConfirmClear(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleClearData}
                        className="flex-1 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                      >
                        Yes, Delete Everything
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* App Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">About</h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>WhatsApp Memory Vault v1.0.0</p>
                <p className="mt-1">Made with ❤️ by Vishnu Tej</p>
                <p className="mt-1">© 2025 - All data stays on your device</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;