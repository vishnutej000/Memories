import React, { useState, useEffect } from 'react';
import { ChatProvider } from './Contexts/ChatContext';
import ChatView from './components/views/chatView';
import DiaryView from './components/views//DairyView';
import StatsView from './components/views/Statsview';
import NavButton from './components/Sidebar/Navbutton';
import FileImport from './components/modals/Fileimport';
import Settings from './components/modals/Settings';
import { useChatData } from './hooks/useChatData';
import './styles/globals.css';


type View = 'chat' | 'diary' | 'stats';

const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('chat');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | undefined>(undefined);
  
  const { 
    messages, 
    importChatFile, 
    exportData,
    exportPDF,
    clearChat
  } = useChatData();
  
  // Settings state
  const [settings, setSettings] = useState({
    theme: 'light' as 'light' | 'dark' | 'system',
    notifications: true,
    autoExport: false,
    privacyMode: false,
  });
  
  // Apply theme based on settings
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings.theme]);
  
  const handleOpenImportModal = () => {
    setShowImportModal(true);
  };
  
  const handleFileImport = async (file: File, userName: string) => {
    setImportError(undefined);
    setIsProcessing(true);
    
    try {
      await importChatFile(file, userName);
      setShowImportModal(false);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import chat');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleExportData = async () => {
    try {
      const blob = await exportData();
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whatsapp-memory-vault-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };
  
  // Toggle theme function
  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };
  
  const renderActiveView = () => {
    switch (activeView) {
      case 'chat':
        return <ChatView onImportClick={handleOpenImportModal} />;
      case 'diary':
        return <DiaryView />;
      case 'stats':
        return <StatsView />;
      default:
        return <ChatView onImportClick={handleOpenImportModal} />;
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-whatsapp-teal text-white shadow-md z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 32 32">
              <path d="M16 2C8.268 2 2 8.268 2 16c0 2.11.47 4.113 1.307 5.91L2 26l4.233-1.245A13.956 13.956 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2z" fill="currentColor"/>
            </svg>
            <h1 className="ml-2 text-xl font-semibold">Memory Vault</h1>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleOpenImportModal}
              className="px-3 py-1 text-sm bg-white text-whatsapp-teal rounded-full hover:bg-opacity-90 focus:outline-none"
            >
              Import Chat
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-full hover:bg-whatsapp-teal-dark focus:outline-none"
              aria-label="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r md:w-16 flex md:flex-col shadow-sm z-10">
          <NavButton
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            label="Chat"
            isActive={activeView === 'chat'}
            onClick={() => setActiveView('chat')}
          />
          <NavButton
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            label="Diary"
            isActive={activeView === 'diary'}
            onClick={() => setActiveView('diary')}
          />
          <NavButton
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            label="Stats"
            isActive={activeView === 'stats'}
            onClick={() => setActiveView('stats')}
          />
          
          {/* Theme Toggle Button */}
          <NavButton
            icon={
              settings.theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )
            }
            label={settings.theme === 'dark' ? 'Light' : 'Dark'}
            isActive={false}
            onClick={toggleTheme}
          />
        </nav>
        
        {/* Active View */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {renderActiveView()}
        </div>
      </main>
      
      {/* Modals */}
      <FileImport
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onFileImport={handleFileImport}
        isProcessing={isProcessing}
        error={importError}
      />
      
      <Settings
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onExportPDF={exportPDF}
        onExportData={handleExportData}
        onClearData={clearChat}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          setSettings(prev => ({ ...prev, ...newSettings }));
        }}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
};

export default App;