import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BsSearch, BsClipboard, BsCheckCircle, BsExclamationTriangleFill } from 'react-icons/bs';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const commonPrefixes = ['', '/api', '/v1', '/api/v1', '/whatsapp', '/chat'];
const commonResources = ['chats', 'chat', 'messages', 'upload', 'users', 'auth', 'export', 'stats'];

// Generate combinations
const generateEndpoints = () => {
  const endpoints: string[] = [];
  
  // Add root endpoint
  endpoints.push('/');
  
  // Add common combinations
  commonPrefixes.forEach(prefix => {
    commonResources.forEach(resource => {
      endpoints.push(`${prefix}/${resource}`);
    });
  });
  
  // Add specific paths we're trying to use
  endpoints.push('/chat/upload');
  endpoints.push('/api/chats');
  endpoints.push('/api/chat/upload');
  
  // Remove duplicates
  return [...new Set(endpoints)].sort();
};

const ApiExplorer: React.FC = () => {
  const [results, setResults] = useState<{[key: string]: {status: number | null, time: number | null, error?: string}}>({});
  const [scanning, setScanning] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState('');
  const [baseUrl, setBaseUrl] = useState(API_BASE_URL);
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [copied, setCopied] = useState(false);
  const [availableEndpoints, setAvailableEndpoints] = useState<string[]>([]);
  
  const testEndpoint = async (endpoint: string) => {
    setCurrentEndpoint(endpoint);
    try {
      const startTime = performance.now();
      const response = await axios.get(`${baseUrl}${endpoint}`, { 
        timeout: 2000,
        validateStatus: () => true // Accept any status code
      });
      const endTime = performance.now();
      
      return {
        status: response.status,
        time: Math.round(endTime - startTime),
        data: response.data
      };
    } catch (error: any) {
      return {
        status: error.response?.status || null,
        time: null,
        error: error.message
      };
    }
  };
  
  const scanEndpoints = async () => {
    if (scanning) return;
    
    setScanning(true);
    setResults({});
    
    const endpoints = generateEndpoints();
    const newResults: typeof results = {};
    const available: string[] = [];
    
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint);
      newResults[endpoint] = result;
      
      // Consider it available if we get any response other than a network error
      if (result.status !== null) {
        available.push(endpoint);
      }
      
      setResults({...newResults});
    }
    
    setAvailableEndpoints(available);
    setScanning(false);
    setCurrentEndpoint('');
  };
  
  const testCustomEndpoint = async () => {
    if (!customEndpoint) return;
    
    const result = await testEndpoint(customEndpoint);
    setResults(prev => ({...prev, [customEndpoint]: result}));
    
    if (result.status !== null && !availableEndpoints.includes(customEndpoint)) {
      setAvailableEndpoints(prev => [...prev, customEndpoint]);
    }
  };
  
  const getStatusIndicator = (status: number | null) => {
    if (status === null) return '❌';
    if (status >= 200 && status < 300) return '✅';
    if (status === 404) return '❓';
    return '⚠️';
  };
  
  const getStatusClass = (status: number | null) => {
    if (status === null) return 'text-red-500';
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status === 404) return 'text-gray-500';
    return 'text-yellow-500';
  };
  
  const copyToClipboard = () => {
    const config = {
      apiEndpoints: {
        CHATS: availableEndpoints.find(e => e.includes('chat') || e.includes('chats')) || '/chat',
        MESSAGES: '/chat/:chatId/messages',
        UPLOAD: availableEndpoints.find(e => e.includes('upload')) || '/chat/upload',
      }
    };
    
    const configString = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(configString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        API Endpoint Explorer
      </h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Backend API URL
        </label>
        <div className="flex">
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-l-md py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="http://localhost:8000"
          />
          <button
            onClick={scanEndpoints}
            disabled={scanning}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {scanning ? 'Scanning...' : 'Scan Endpoints'}
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Test Custom Endpoint
        </label>
        <div className="flex">
          <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md px-3 py-2 text-gray-500 dark:text-gray-400">
            {baseUrl}
          </div>
          <input
            type="text"
            value={customEndpoint}
            onChange={(e) => setCustomEndpoint(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-gray-600 py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="/your/custom/endpoint"
          />
          <button
            onClick={testCustomEndpoint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <BsSearch />
          </button>
        </div>
      </div>
      
      {currentEndpoint && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded">
          <p className="text-blue-800 dark:text-blue-300 text-sm">
            Testing endpoint: <code className="bg-blue-100 dark:bg-blue-900/30 px-1 py-0.5 rounded">{baseUrl}{currentEndpoint}</code>
          </p>
        </div>
      )}
      
      {availableEndpoints.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-800 dark:text-white">
              Available Endpoints Detected
            </h3>
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              {copied ? <BsCheckCircle className="mr-1" /> : <BsClipboard className="mr-1" />}
              {copied ? "Copied!" : "Copy Config"}
            </button>
          </div>
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-md p-4">
            <div className="flex flex-wrap gap-2">
              {availableEndpoints.map((endpoint) => (
                <div key={endpoint} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                  {endpoint}
                  <span className="ml-1 text-green-600 dark:text-green-400">
                    {results[endpoint]?.status && `(${results[endpoint].status})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
          Scan Results
        </div>
        <div className="overflow-y-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Endpoint
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Time (ms)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(results).map(([endpoint, result]) => (
                <tr key={endpoint} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 font-mono">
                    {endpoint}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span className={getStatusClass(result.status)}>
                      {getStatusIndicator(result.status)} {result.status || 'Error'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {result.time !== null ? `${result.time}ms` : '-'}
                  </td>
                </tr>
              ))}
              {Object.keys(results).length === 0 && scanning === false && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-sm text-center text-gray-500 dark:text-gray-400">
                    Click "Scan Endpoints" to start testing
                  </td>
                </tr>
              )}
              {Object.keys(results).length === 0 && scanning === true && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-sm text-center text-gray-500 dark:text-gray-400">
                    Scanning...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800 rounded">
        <div className="flex items-start">
          <BsExclamationTriangleFill className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">Backend Configuration Recommendation</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              The most common API structure for WhatsApp chat apps uses:
            </p>
            <ul className="mt-1 ml-4 list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400">
              <li><code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 py-0.5 rounded">/chat</code> - Get all chats</li>
              <li><code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 py-0.5 rounded">/chat/upload</code> - Upload new chat</li>
              <li><code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 py-0.5 rounded">/chat/:chatId</code> - Get specific chat</li>
              <li><code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 py-0.5 rounded">/chat/:chatId/messages</code> - Get messages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiExplorer;