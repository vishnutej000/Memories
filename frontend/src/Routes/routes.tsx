import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/layout/AuthLayout';
import LoadingScreen from '../components/common/LoadingScreen';
import { useAuth } from '../hooks/useAuth';

// Lazy loaded components for code splitting
const HomePage = lazy(() => import('../pages/HomePage'));
const UploadPage = lazy(() => import('../pages/UploadPage'));
const ChatPage = lazy(() => import('../pages/ChatPage'));
const DiaryPage = lazy(() => import('../pages/DairyPage'));
const StatsPage = lazy(() => import('../pages/StatsPage'));
const MemoryLanePage = lazy(() => import('../pages/MemoryLanePage'));
const ExportPage = lazy(() => import('../pages/ExportPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));

// Renamed from Routes to AppRoutes to avoid conflict
const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {!isAuthenticated ? (
          // Public routes
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Route>
        ) : (
          // Protected routes
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/chat/:chatId" element={<ChatPage />} />
            <Route path="/diary/:chatId" element={<DiaryPage />} />
            <Route path="/stats/:chatId" element={<StatsPage />} />
            <Route path="/memory-lane/:chatId" element={<MemoryLanePage />} />
            <Route path="/export/:chatId" element={<ExportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        )}
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;