import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAllData, exportDatabaseToFile, importDatabaseFromFile } from '../services/storageservices';
import { useTheme } from '../Components/contexts/ThemeContext';
import { getLocalStorageUsage } from '../Hooks/useLocalStorage';


import Button from '../Components/UI/Button';
import Tabs from '../Components/UI/Tabs';

import Spinner from '../Components/UI/Spinner';
import Modal from '../Components/UI/Modal';


interface SettingsViewProps {
  setPin: (pin: string | null) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ setPin }) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'storage'>('general');
  
  // Storage info
  const storageInfo = getLocalStorageUsage();
  
  // Confirmation modals
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [showPinRemoveModal, setShowPinRemoveModal] = useState(false);
  
  // PIN state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [hasPin, setHasPin] = useState<boolean>(!!localStorage.getItem('app-pin'));
  
  // Backup/restore state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  
  // Clear data in progress
  const [isClearing, setIsClearing] = useState(false);
  
  // Handle clear all data
  const handleClearAllData = async () => {
    try {
      setIsClearing(true);
      await clearAllData();
      setShowClearDataModal(false);
      navigate('/');
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      setIsClearing(false);
    }
  };
  
  // Handle PIN setup
  const handlePinSetup = () => {
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    
    if (newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    
    // Save PIN
    setPin(newPin);
    setHasPin(true);
    setShowPinSetupModal(false);
    
    // Reset state
    setNewPin('');
    setConfirmPin('');
    setPinError(null);
  };
  
  // Handle PIN removal
  const handlePinRemove = () => {
    setPin(null);
    setHasPin(false);
    setShowPinRemoveModal(false);
  };
  
  // Handle export
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportSuccess(false);
      
      const { blob, filename } = await exportDatabaseToFile();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle import
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsImporting(true);
      setImportError(null);
      setImportSuccess(false);
      
      await importDatabaseFromFile(file);
      
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
      
      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error('Error importing data:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to import data');
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-whatsapp-teal dark:bg-gray-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-6 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          {/* Tabs */}
          <Tabs
            tabs={[
              { 
                id: 'general',
                label: 'General',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )
              },
              {
                id: 'privacy',
                label: 'Privacy & Security',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )
              },
              {
                id: 'storage',
                label: 'Storage & Backup',
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                )
              }
            ]}
            activeTabId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
          />
          
          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  General Settings
                </h2>
                
                {/* Appearance */}
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white">
                      Dark Mode
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Switch between light and dark theme
                    </div>
                  </div>
                  
                  <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full bg-gray-200 dark:bg-gray-600">
                    <label htmlFor="toggle" className="absolute left-0 top-0 w-6 h-6 mb-2 transition duration-100 ease-in-out transform bg-white dark:bg-gray-200 rounded-full cursor-pointer" style={{ transform: darkMode ? 'translateX(100%)' : 'translateX(0)' }}></label>
                    <input type="checkbox" id="toggle" name="toggle" className="appearance-none w-full h-full active:outline-none focus:outline-none cursor-pointer" checked={darkMode} onChange={toggleDarkMode} />
                  </div>
                </div>
                
                {/* About */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-gray-800 dark:text-white mb-2">
                    About WhatsApp Memory Vault
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p className="mb-2">Version 1.0.0</p>
                    <p>WhatsApp Memory Vault is a tool for exploring, searching, and preserving your WhatsApp chat history. Your data is stored locally in your browser and never leaves your device.</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Privacy & Security
                </h2>
                
                {/* App Lock */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-gray-800 dark:text-white mb-2">
                    App Lock
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Set a PIN to prevent unauthorized access to your chats
                  </div>
                  
                  {hasPin ? (
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowPinRemoveModal(true)}
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        }
                      >
                        Remove PIN
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => setShowPinSetupModal(true)}
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        }
                      >
                        Change PIN
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowPinSetupModal(true)}
                      variant="outline"
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      }
                    >
                      Set up PIN
                    </Button>
                  )}
                </div>
                
                {/* Data Privacy */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-gray-800 dark:text-white mb-2">
                    Data Privacy
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p className="mb-2">WhatsApp Memory Vault operates entirely within your browser. Your chat data is stored locally and never sent to any server.</p>
                    <p>You can delete all data from your browser at any time using the "Clear All Data" button below.</p>
                  </div>
                </div>
                
                {/* Clear Data */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => setShowClearDataModal(true)}
                    variant="danger"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    }
                  >
                    Clear All Data
                  </Button>
                </div>
              </div>
            )}
            
            {activeTab === 'storage' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Storage & Backup
                </h2>
                
                {/* Storage Usage */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-gray-800 dark:text-white mb-2">
                    Storage Usage
                  </div>
                  
                  <div className="mb-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                    <div
                      className="bg-whatsapp-dark dark:bg-whatsapp-light h-2.5 rounded-full"
                      style={{ width: `${Math.min(100, storageInfo.percentage)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{storageInfo.formatted} used</span>
                    <span>{Math.round(storageInfo.percentage)}% of available storage</span>
                  </div>
                </div>
                
                {/* Backup & Restore */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-gray-800 dark:text-white mb-2">
                    Backup & Restore
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Backup your data to a file that you can restore later
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleExport}
                      disabled={isExporting}
                      variant="outline"
                      icon={isExporting ? (
                        <Spinner size="small" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                    >
                      {isExporting ? 'Exporting...' : 'Export Backup'}
                    </Button>
                    
                    <label className="cursor-pointer">
                      <Button
                        variant="outline"
                        disabled={isImporting}
                        icon={isImporting ? (
                          <Spinner size="small" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        )}
                      >
                        {isImporting ? 'Importing...' : 'Import Backup'}
                      </Button>
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleImport}
                        disabled={isImporting}
                      />
                    </label>
                    
                    {exportSuccess && (
                      <div className="ml-auto py-2 px-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md text-sm">
                        ✓ Backup exported successfully
                      </div>
                    )}
                    
                    {importSuccess && (
                      <div className="ml-auto py-2 px-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md text-sm">
                        ✓ Backup imported successfully
                      </div>
                    )}
                    
                    {importError && (
                      <div className="ml-auto py-2 px-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
                        ✗ {importError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Clear Data Confirmation Modal */}
      <Modal
        isOpen={showClearDataModal}
        onClose={() => setShowClearDataModal(false)}
        title="Clear All Data"
        size="small"
      >
        <div className="space-y-4">
          <div className="flex items-center text-red-600 dark:text-red-400 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">Warning: This action cannot be undone!</span>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to clear all data? This will permanently delete all your imported chats, journal entries, and settings.
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-sm text-gray-600 dark:text-gray-400">
            <strong>Tip:</strong> Consider creating a backup before clearing your data.
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={() => setShowClearDataModal(false)}
            variant="secondary"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleClearAllData}
            variant="danger"
            disabled={isClearing}
            icon={isClearing && <Spinner size="small" color="white" />}
          >
            {isClearing ? 'Clearing...' : 'Clear All Data'}
          </Button>
        </div>
      </Modal>
      
      {/* PIN Setup Modal */}
      <Modal
        isOpen={showPinSetupModal}
        onClose={() => {
          setShowPinSetupModal(false);
          setNewPin('');
          setConfirmPin('');
          setPinError(null);
        }}
        title={hasPin ? "Change PIN" : "Set up PIN"}
        size="small"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            {hasPin 
              ? "Set a new PIN to protect your app. You'll need to enter this PIN when you open the app."
              : "Set a PIN to protect your app. You'll need to enter this PIN when you open the app."}
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {hasPin ? "New PIN" : "PIN"}
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-whatsapp-dark focus:border-whatsapp-dark dark:bg-gray-700 dark:text-white"
              placeholder="Enter PIN"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-whatsapp-dark focus:border-whatsapp-dark dark:bg-gray-700 dark:text-white"
              placeholder="Confirm PIN"
            />
          </div>
          
          {pinError && (
            <div className="text-red-500 dark:text-red-400 text-sm">
              {pinError}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={() => {
              setShowPinSetupModal(false);
              setNewPin('');
              setConfirmPin('');
              setPinError(null);
            }}
            variant="secondary"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handlePinSetup}
            variant="primary"
            disabled={!newPin || !confirmPin}
          >
            {hasPin ? "Change PIN" : "Set PIN"}
          </Button>
        </div>
      </Modal>
      
      {/* PIN Remove Modal */}
      <Modal
        isOpen={showPinRemoveModal}
        onClose={() => setShowPinRemoveModal(false)}
        title="Remove PIN"
        size="small"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to remove the PIN? This will disable the app lock and anyone with access to your device will be able to open the app.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
            <div className="flex items-center text-yellow-800 dark:text-yellow-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">Security Warning</span>
            </div>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-200">
              Removing the PIN will make your data accessible to anyone who has access to your device.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={() => setShowPinRemoveModal(false)}
            variant="secondary"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handlePinRemove}
            variant="danger"
          >
            Remove PIN
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsView;