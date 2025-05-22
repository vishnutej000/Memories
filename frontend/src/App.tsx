import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { hasAnyData } from './services/storageservices';
import Home from './pages/Home';
import WhatsAppViewer from './pages/WhatsapppViewer';
import DiaryView from './pages/DairyView';
import AnalyticsView from './pages/AnalyticsView';
import SettingsView from './pages/SettingsView';
import NotFound from './pages/NotFound';
import PinLock from './components/Auth/PinLock';
import Spinner from './components/UI/Spinner';

const App: React.FC = () => {
  const [hasData, setHasData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pinLocked, setPinLocked] = useState<boolean>(false);
  
  // Check if app has any data
  useEffect(() => {
    const checkData = async () => {
      try {
        const dataExists = await hasAnyData();
        setHasData(dataExists);
      } catch (error) {
        console.error('Error checking data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkData();
  }, []);
  
  // Check if app has PIN lock
  useEffect(() => {
    const storedPin = localStorage.getItem('app-pin');
    setPinLocked(!!storedPin);
  }, []);
  
  // Set or clear PIN
  const handleSetPin = (pin: string | null) => {
    if (pin) {
      localStorage.setItem('app-pin', pin);
      setPinLocked(true);
    } else {
      localStorage.removeItem('app-pin');
      setPinLocked(false);
    }
  };
  
  // Handle PIN unlock
  const handleUnlock = () => {
    setPinLocked(false);
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Spinner size="large" text="Loading..." />
      </div>
    );
  }
  
  // Show PIN lock screen
  if (pinLocked) {
    return <PinLock onUnlock={handleUnlock} />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<Home hasData={hasData} />} />
      <Route path="/chat/:chatId" element={<WhatsAppViewer />} />
      <Route path="/diary/:chatId" element={<DiaryView />} />
      <Route path="/analytics/:chatId" element={<AnalyticsView />} />
      <Route path="/settings" element={<SettingsView setPin={handleSetPin} />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default App;