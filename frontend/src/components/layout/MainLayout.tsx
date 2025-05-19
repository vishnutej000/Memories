import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../navigation/Navbar';
import Sidebar from '../navigation/Sidebar';
import { useTheme } from '../../hooks/useTheme';

const MainLayout: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 ${theme}`}>
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        
        <main className="flex-1 overflow-auto p-4">
          <div className="container mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;