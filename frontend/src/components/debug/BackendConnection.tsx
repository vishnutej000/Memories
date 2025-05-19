import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BsLightningChargeFill, BsLightningCharge, BsCheck2Circle, BsXCircle, BsArrowClockwise } from 'react-icons/bs';

const BackendConnectionTest: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:8000');
  const [testResults, setTestResults] = useState<{[key: string]: boolean | null}>({});
  const [availableEndpoints, setAvailableEndpoints] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // List of common endpoints to test
  const endpointsToTest = [
    '/chat',
    '/api/chats',
    '/whatsapp/chats',
    '/api/chat',
    '/v1/chats',
    '/api/v1/chats',
    '/chats',
    '/messages',
    '/api',
    '/'
  ];

  const testEndpoints = async () => {
    setIsTesting(true);
    const results: {[key: string]: boolean | null} = {};
    const available: string[] = [];
    
    for (const endpoint of endpointsToTest) {
      try {
        const url = `${baseUrl}${endpoint}`;
        const result = await axios.get(url, { timeout: 3000 });
        
        const isSuccessful = result.status >= 200 && result.status < 400;
        results[endpoint] = isSuccessful;
        
        if (isSuccessful) {
          available.push(endpoint);
        }
      } catch (error: any) {
        if (error.response) {
          // We got a response, but not a 2xx success
          // For 404, we know the endpoint exists but resource not found
          results[endpoint] = error.response.status !== 404;
          
          // If it's not a 404, consider it potentially available
          if (error.response.status !== 404) {
            available.push(endpoint);
          }
        } else {
          // Request made but no response or network error
          results[endpoint] = null;
        }
      }
    }
    
    setTestResults(results);
    setAvailableEndpoints(available);
    setIsTesting(false);
  };

  useEffect(() => {
    testEndpoints();
  }, []);

  return (
    <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white">
          Backend Connection Test
        </h2>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          {showDebug ? "Hide Details" : "Show Details"}
        </button>
      </div>
      
      <div className="flex items-center space-x-2 mb-4">
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Backend URL"
        />
        <button
          onClick={testEndpoints}
          disabled={isTesting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isTesting ? (
            <>
              <BsLightningCharge className="animate-pulse mr-2" />
              Testing...
            </>
          ) : (
            <>
              <BsLightningChargeFill className="mr-2" />
              Test Connection
            </>
          )}
        </button>
      </div>
      
      {availableEndpoints.length > 0 && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-md">
          <p className="text-green-800 dark:text-green-300 text-sm font-medium flex items-center">
            <BsCheck2Circle className="mr-2" />
            Available Endpoints Detected
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableEndpoints.map((endpoint) => (
              <span key={endpoint} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                {endpoint}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {showDebug && Object.keys(testResults).length > 0 && (
        <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
            Endpoint Test Results
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Endpoint
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(testResults).map(([endpoint, result]) => (
                <tr key={endpoint}>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {endpoint}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {result === true && (
                      <span className="inline-flex items-center text-green-700 dark:text-green-400">
                        <BsCheck2Circle className="mr-1" /> Available
                      </span>
                    )}
                    {result === false && (
                      <span className="inline-flex items-center text-red-700 dark:text-red-400">
                        <BsXCircle className="mr-1" /> Not Available
                      </span>
                    )}
                    {result === null && (
                      <span className="inline-flex items-center text-gray-500 dark:text-gray-400">
                        <BsArrowClockwise className="mr-1" /> No Response
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
        <p className="mb-2">Configure your frontend to use these API endpoints by updating <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">src/api/config.ts</code></p>
        <p>Make sure your backend CORS settings allow requests from: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{window.location.origin}</code></p>
      </div>
    </div>
  );
};

export default BackendConnectionTest;