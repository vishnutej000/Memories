import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { 
  BsWhatsapp, BsUpload, BsBarChart, BsBook, BsCalendar4Week, 
  BsFilePdf, BsTools, BsArrowClockwise, BsClockHistory,
  BsChat, BsHeart, BsSearch, BsShieldCheck, BsSpeedometer, BsGithub
} from 'react-icons/bs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FallbackUI from '../components/common/FallbackUI';

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}> = ({ icon, title, description, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 ${className}`}>
    <div className="flex items-center mb-4">
      <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full mr-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
        {title}
      </h3>
    </div>
    <p className="text-gray-600 dark:text-gray-300 text-sm">
      {description}
    </p>
  </div>
);

const HomePage: React.FC = () => {
  const { activeChats, isLoading, error, fetchChats, apiConnected, retryConnection } = useChat();
  const [latestActivity, setLatestActivity] = useState<Date | null>(null);
  const [userActivityCounts, setUserActivityCounts] = useState<Record<string, number>>({});
  
  // Fetch chats when component mounts
  useEffect(() => {
    if (typeof fetchChats === 'function') {
      try {
        fetchChats();
      } catch (err) {
        console.error("Error fetching chats in HomePage:", err);
      }
    }
  }, [fetchChats]);
  
  // Analyze chat data to find latest activity
  useEffect(() => {
    if (activeChats && activeChats.length > 0) {
      // Find latest activity date among all chats
      const latestDate = activeChats.reduce((latest, chat) => {
        if (!chat.date_range?.end) return latest;
        const chatEndDate = new Date(chat.date_range.end);
        return chatEndDate > latest ? chatEndDate : latest;
      }, new Date(0));
      
      setLatestActivity(latestDate);
      
      // Count messages by participant
      const counts: Record<string, number> = {};
      activeChats.forEach(chat => {
        if (chat.participants) {
          chat.participants.forEach(participant => {
            if (participant !== 'You') {
              counts[participant] = (counts[participant] || 0) + 1;
            }
          });
        }
      });
      setUserActivityCounts(counts);
    }
  }, [activeChats]);
  
  // Format date function with error handling
  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error("Date formatting error:", error);
      return 'Unknown date';
    }
  };
  
  // Safely render content
  const safeRender = (condition: any, component: React.ReactNode, fallback: React.ReactNode = null) => {
    try {
      return condition ? component : fallback;
    } catch (error) {
      console.error("Render error:", error);
      return fallback;
    }
  };
  
  // If there's a connection error, show the fallback UI
  if (error && !apiConnected) {
    return (
      <FallbackUI 
        title="Backend Connection Error"
        message={error}
        retryAction={retryConnection}
        showSetupGuide={true}
      />
    );
  }
  
  // Current date for display
  const currentDate = "2025-05-19";
  const currentUser = "vishnutej000";
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-5 rounded-full">
              <BsWhatsapp className="text-primary-600 dark:text-primary-400 text-5xl" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
            WhatsApp Memory Vault
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Transform your WhatsApp chats into beautiful, interactive memories with powerful analytics
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/upload"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
            >
              <BsUpload className="mr-2" /> Upload Chat
            </Link>
            {activeChats && activeChats.length > 0 && (
              <Link
                to={`/chat/${activeChats[0].id}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 border border-primary-600 dark:border-primary-500 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-600 transition-colors shadow-md"
              >
                <BsChat className="mr-2" /> View Latest Chat
              </Link>
            )}
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}
        
        {/* Error Message */}
        {error && !isLoading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-8 max-w-3xl mx-auto">
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={() => fetchChats()}
              className="flex items-center text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            >
              <BsArrowClockwise className="mr-2" /> Retry Loading Chats
            </button>
          </div>
        )}
        
        {/* No Chats State */}
        {!isLoading && !error && (!activeChats || activeChats.length === 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-10 text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              Welcome to WhatsApp Memory Vault!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
              Explore, analyze, and relive your WhatsApp conversations. Get started by uploading your first WhatsApp chat export.
            </p>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg mb-8">
              <h3 className="font-medium text-gray-800 dark:text-white mb-2">How to export your chat:</h3>
              <ol className="text-left text-gray-600 dark:text-gray-300 space-y-2 list-decimal list-inside">
                <li>Open WhatsApp on your phone</li>
                <li>Open the chat you want to export</li>
                <li>Tap the three dots in the top right corner</li>
                <li>Select "More" and then "Export chat"</li>
                <li>Choose "Without media" (recommended)</li>
                <li>Send the file to yourself and download it</li>
              </ol>
            </div>
            <Link
              to="/upload"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
            >
              <BsUpload className="mr-2" /> Upload Your First Chat
            </Link>
          </div>
        )}
        
        {/* Recent Chats Section */}
        {!isLoading && !error && activeChats && activeChats.length > 0 && (
          <div className="mb-20">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Your Recent Chats
              </h2>
              <Link
                to="/upload"
                className="text-primary-600 dark:text-primary-400 hover:underline flex items-center"
              >
                <BsUpload className="mr-1" /> Upload New
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeChats.slice(0, 6).map(chat => (
                <div key={chat.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2 truncate">
                      {chat.is_group_chat 
                        ? chat.filename 
                        : (chat.participants && Array.isArray(chat.participants) 
                           ? chat.participants.filter(p => p !== 'You').join(', ') 
                           : '') || chat.filename}
                    </h3>
                    
                    {safeRender(chat.date_range, (
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 flex items-center">
                        <BsClockHistory className="mr-1 text-gray-400" />
                        {formatDistanceToNow(new Date(chat.date_range?.end), { addSuffix: true })}
                        <span className="mx-2">•</span>
                        <span>{chat.message_count || 0} messages</span>
                      </p>
                    ))}
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Link
                        to={`/chat/${chat.id}`}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm"
                      >
                        <BsChat className="mr-1" /> Chat
                      </Link>
                      <Link
                        to={`/stats/${chat.id}`}
                        className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-sm"
                      >
                        <BsBarChart className="mr-1" /> Stats
                      </Link>
                      <Link
                        to={`/memory-lane/${chat.id}`}
                        className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-sm"
                      >
                        <BsCalendar4Week className="mr-1" /> Memories
                      </Link>
                    </div>
                    
                    {safeRender(chat.date_range, (
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatDate(chat.date_range?.start)}</span>
                        <span>to</span>
                        <span>{formatDate(chat.date_range?.end)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {activeChats.length > 6 && (
              <div className="text-center mt-8">
                <Link
                  to="/chats"
                  className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View all {activeChats.length} chats
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Quick Stats Section (only show if there are chats) */}
        {activeChats && activeChats.length > 0 && latestActivity && (
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">
              Your Chat Statistics
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
                    <BsChat className="text-blue-600 dark:text-blue-400 text-lg" />
                  </div>
                  <h3 className="text-gray-800 dark:text-white font-medium">Total Chats</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {activeChats.length}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center mb-2">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mr-3">
                    <BsBarChart className="text-green-600 dark:text-green-400 text-lg" />
                  </div>
                  <h3 className="text-gray-800 dark:text-white font-medium">Total Messages</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {activeChats.reduce((sum, chat) => sum + (chat.message_count || 0), 0).toLocaleString()}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center mb-2">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full mr-3">
                    <BsHeart className="text-purple-600 dark:text-purple-400 text-lg" />
                  </div>
                  <h3 className="text-gray-800 dark:text-white font-medium">Most Active Chat</h3>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {activeChats.reduce((max, chat) => 
                    (chat.message_count || 0) > (max.message_count || 0) ? chat : max, activeChats[0])?.filename}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center mb-2">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full mr-3">
                    <BsClockHistory className="text-amber-600 dark:text-amber-400 text-lg" />
                  </div>
                  <h3 className="text-gray-800 dark:text-white font-medium">Latest Activity</h3>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatDistanceToNow(latestActivity, { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8 text-center">
            Powerful Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<BsBarChart className="text-xl text-primary-600" />}
              title="Chat Analytics"
              description="Gain insights from your conversations with detailed statistics, activity patterns, and message trends."
            />
            
            <FeatureCard 
              icon={<BsCalendar4Week className="text-xl text-primary-600" />}
              title="Memory Lane"
              description="Travel back in time to relive special moments, anniversaries, and memorable conversations."
            />
            
            <FeatureCard 
              icon={<BsBook className="text-xl text-primary-600" />}
              title="Chat Diary"
              description="Transform your chats into a beautiful diary format, organized by date with a clean interface."
            />
            
            <FeatureCard 
              icon={<BsSearch className="text-xl text-primary-600" />}
              title="Powerful Search"
              description="Quickly find specific messages, topics, or dates with powerful search capabilities."
            />
            
            <FeatureCard 
              icon={<BsFilePdf className="text-xl text-primary-600" />}
              title="Export Options"
              description="Export your chats in multiple formats including PDF, making them easy to share or archive."
            />
            
            <FeatureCard 
              icon={<BsShieldCheck className="text-xl text-primary-600" />}
              title="Privacy Focused"
              description="Your data never leaves your device. All processing happens locally for maximum privacy."
            />
          </div>
        </div>
        
        {/* API Debug link (subtly hidden) */}
        <div className="mt-12 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
            Having trouble connecting to the backend?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Use the API diagnostics tool to troubleshoot connection issues and identify which endpoints are available.
          </p>
          <Link
            to="/api-debug"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline"
          >
            <BsTools className="mr-1" /> Open API Diagnostics Tool
          </Link>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <BsWhatsapp className="text-primary-600 dark:text-primary-400 text-2xl mr-2" />
                <span className="text-xl font-bold text-gray-800 dark:text-white">WhatsApp Memory Vault</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Transform your WhatsApp chats into beautiful, interactive memories
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                <p>Last updated: {currentDate}</p>
                <p>User: {currentUser}</p>
              </div>
              <div className="mt-4 flex space-x-4">
                <a 
                  href="https://github.com/vishnutej000/WhatsAppMemoryVault" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <BsGithub className="text-xl" />
                </a>
                <a 
                  href="#" 
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <BsSpeedometer className="text-xl" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
            <p>© 2025 WhatsApp Memory Vault. All rights reserved.</p>
            <p className="mt-1">WhatsApp is a trademark of Meta Platforms, Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;