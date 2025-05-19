import React from 'react';
import { Outlet } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import { useTheme } from '../../hooks/useTheme';

const AuthLayout: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div className={`flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 ${theme}`}>
      <header className="p-4 flex justify-end">
        <ThemeToggle />
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <Outlet />
      </main>
      
      <footer className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} WhatsApp Memory Vault. All rights reserved.
      </footer>
    </div>
  );
};

export default AuthLayout;