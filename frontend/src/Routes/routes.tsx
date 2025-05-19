import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import UploadPage from '../pages/UploadPage';
import ChatPage from '../pages/ChatPage';
import StatisticsPage from '../pages/StatsPage';
import DiaryPage from '../pages/DairyPage';
import ExportPage from '../pages/ExportPage';
import MemoryLanePage from '../pages/MemoryLanePage';
import NotFoundPage from '../pages/NotFoundPage';
import MainLayout from '../components/layout/MainLayout';
import ApiDebugPage from '../pages/ApiDebugPage'; // Add this import

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="chat/:chatId" element={<ChatPage />} />
        <Route path="stats/:chatId" element={<StatisticsPage />} />
        <Route path="diary/:chatId" element={<DiaryPage />} />
        <Route path="export/:chatId" element={<ExportPage />} />
        <Route path="memory-lane/:chatId" element={<MemoryLanePage />} />
        <Route path="api-debug" element={<ApiDebugPage />} /> {/* Add this route */}
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;