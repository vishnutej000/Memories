import React from 'react';
import { Link } from 'react-router-dom';
import { BsArrowLeft, BsServer, BsCodeSlash, BsLightningCharge } from 'react-icons/bs';
import BackendConnectionTest from '../components/debug/BackendConnection';
import ApiExplorer from '../utils/ApiExplorer';

// Current time: 2025-05-19 06:28:12
// User: vishnutej000

const ApiDebugPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white mb-6"
      >
        <BsArrowLeft className="mr-2" />
        Back to Home
      </Link>
      
      <div className="text-center mb-8">
        <BsServer className="text-primary-500 text-5xl mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          API Connection Diagnostics
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Use this page to diagnose and fix backend API connection issues
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        {/* API Explorer - NEW */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
              <BsLightningCharge className="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white">API Endpoint Discovery</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Find out which API endpoints are available on your backend
              </p>
            </div>
          </div>
          
          <ApiExplorer />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <BsCodeSlash className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white">Backend Configuration Guide</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                These are the API endpoints the frontend is currently trying to use:
              </p>
            </div>
          </div>
          
          <div className="mt-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-md border border-gray-200 dark:border-gray-600">
            <pre className="text-sm overflow-auto text-gray-800 dark:text-gray-200">
{`// Current API configuration in src/api/config.ts
export const API_ENDPOINTS = {
  // Main endpoints
  CHATS: '/chat',                      // <-- This is where the 404 error is coming from
  CHAT: '/chat/:chatId',               
  CHAT_UPLOAD: '/chat/upload',         
  
  // Message-related endpoints
  MESSAGES: '/chat/:chatId/messages',
  MESSAGES_BY_DATE: '/chat/:chatId/messages/date/:date',
  SEARCH_MESSAGES: '/chat/:chatId/search',
  
  // Additional endpoints
  DATE_RANGES: '/chat/:chatId/dates',
};`}
            </pre>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">
              Options to Fix the Issue:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 ml-4">
              <li>Create these endpoints on your backend server to match the frontend configuration</li>
              <li>OR Update the frontend configuration to match your backend endpoints</li>
              <li>Check your backend logs for more information about routing problems</li>
            </ul>
          </div>
        </div>
        
        <BackendConnectionTest />
      </div>
    </div>
  );
};

export default ApiDebugPage;