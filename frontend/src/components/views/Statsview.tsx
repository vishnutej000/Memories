import React, { useState, useEffect } from 'react';
import { useChatData } from '../../hooks/useChatData';

interface EmojiCount {
  emoji: string;
  count: number;
}

interface DailyActivity {
  date: string;
  count: number;
  sentiment: number;
}

interface SenderStats {
  sender: string;
  messageCount: number;
  avgMessageLength: number;
  topEmojis: EmojiCount[];
}

const StatsView: React.FC = () => {
  const { messages, loading, error } = useChatData();
  const [activeTab, setActiveTab] = useState<'overview' | 'emojis' | 'activity' | 'senders'>('overview');
  
  const [allEmojis, setAllEmojis] = useState<EmojiCount[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [senderStats, setSenderStats] = useState<SenderStats[]>([]);
  
  // Get emoji from string
  const extractEmojis = (text: string): string[] => {
    const emojiRegex = /[\p{Emoji}\u200d]+/gu;
    return text.match(emojiRegex) || [];
  };
  
  // Prepare stats when messages change
  useEffect(() => {
    if (loading || messages.length === 0) return;
    
    // Process emojis
    const emojiCounts: Record<string, number> = {};
    messages.forEach(msg => {
      if (msg.type !== 'text') return;
      
      const emojisInMessage = extractEmojis(msg.content);
      emojisInMessage.forEach(emoji => {
        emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
      });
    });
    
    const sortedEmojis = Object.entries(emojiCounts)
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
    
    setAllEmojis(sortedEmojis);
    
    // Process daily activity
    const dailyCounts: Record<string, {count: number, sentiment: number}> = {};
    messages.forEach(msg => {
      const date = new Date(msg.timestamp).toISOString().split('T')[0];
      
      if (!dailyCounts[date]) {
        dailyCounts[date] = { count: 0, sentiment: 0 };
      }
      
      dailyCounts[date].count++;
      
      // Mock sentiment calculation (real app would use actual sentiment scores)
      dailyCounts[date].sentiment = Math.random() * 2 - 1; // Between -1 and 1
    });
    
    const sortedDailyActivity = Object.entries(dailyCounts)
      .map(([date, { count, sentiment }]) => ({ date, count, sentiment }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    setDailyActivity(sortedDailyActivity);
    
    // Process sender stats
    const senders: Record<string, {
      messageCount: number,
      totalLength: number,
      emojis: Record<string, number>
    }> = {};
    
    messages.forEach(msg => {
      if (!senders[msg.sender]) {
        senders[msg.sender] = {
          messageCount: 0,
          totalLength: 0,
          emojis: {}
        };
      }
      
      senders[msg.sender].messageCount++;
      
      if (msg.type === 'text') {
        senders[msg.sender].totalLength += msg.content.length;
        
        const emojisInMessage = extractEmojis(msg.content);
        emojisInMessage.forEach(emoji => {
          senders[msg.sender].emojis[emoji] = (senders[msg.sender].emojis[emoji] || 0) + 1;
        });
      }
    });
    
    const processedSenderStats = Object.entries(senders).map(([sender, stats]) => {
      const topEmojis = Object.entries(stats.emojis)
        .map(([emoji, count]) => ({ emoji, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      return {
        sender,
        messageCount: stats.messageCount,
        avgMessageLength: stats.messageCount > 0 
          ? Math.round(stats.totalLength / stats.messageCount) 
          : 0,
        topEmojis
      };
    }).sort((a, b) => b.messageCount - a.messageCount);
    
    setSenderStats(processedSenderStats);
    
  }, [messages, loading]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-whatsapp-teal mx-auto"></div>
          <p className="mt-3 text-gray-600">Calculating stats...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900">Error Loading Stats</h3>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }
  
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-whatsapp-teal text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900">No Stats Available</h3>
          <p className="mt-2 text-gray-600">
            Import your WhatsApp chat to see fascinating stats and insights.
          </p>
          <button 
            className="mt-4 px-4 py-2 bg-whatsapp-teal text-white rounded-lg shadow hover:bg-opacity-90"
            onClick={() => {/* Open import modal */}}
          >
            Import Chat
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-white border-b px-4 py-3 shadow-sm">
        <h2 className="text-xl font-medium text-gray-900">Chat Insights</h2>
      </div>
      
      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="flex overflow-x-auto">
          <button
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${
              activeTab === 'overview' 
                ? 'text-whatsapp-teal border-b-2 border-whatsapp-teal' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${
              activeTab === 'emojis' 
                ? 'text-whatsapp-teal border-b-2 border-whatsapp-teal' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('emojis')}
          >
            Emoji Analysis
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${
              activeTab === 'activity' 
                ? 'text-whatsapp-teal border-b-2 border-whatsapp-teal' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('activity')}
          >
            Activity Timeline
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${
              activeTab === 'senders' 
                ? 'text-whatsapp-teal border-b-2 border-whatsapp-teal' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('senders')}
          >
            Participant Stats
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Chat Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Total Messages</p>
                  <p className="text-2xl font-bold text-whatsapp-teal">{messages.length.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">First Message</p>
                  <p className="text-gray-900">
                    {messages.length > 0 ? formatDate(new Date(messages[0].timestamp).toISOString()) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Latest Message</p>
                  <p className="text-gray-900">
                    {messages.length > 0 ? formatDate(new Date(messages[messages.length-1].timestamp).toISOString()) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Participants</p>
                  <p className="text-gray-900">{senderStats.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Emojis</h3>
              {allEmojis.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allEmojis.slice(0, 10).map(({ emoji, count }) => (
                    <div key={emoji} className="text-center">
                      <div className="text-2xl">{emoji}</div>
                      <div className="text-xs text-gray-500 mt-1">{count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No emojis used</p>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Peaks</h3>
              {dailyActivity.length > 0 ? (
                <div className="space-y-3">
                  {dailyActivity
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map(day => (
                      <div key={day.date} className="flex justify-between items-center">
                        <span className="text-gray-900">{formatDate(day.date)}</span>
                        <div className="flex items-center">
                          <span className="font-medium text-whatsapp-teal">{day.count}</span>
                          <span className="text-gray-500 ml-1">messages</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <p className="text-gray-500 italic">No activity data</p>
              )}
            </div>
          </div>
        )}
        
        {/* Emoji Analysis Tab */}
        {activeTab === 'emojis' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Emoji Usage</h3>
            
            {allEmojis.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {allEmojis.map(({ emoji, count }) => (
                  <div 
                    key={emoji} 
                    className="bg-gray-50 rounded-lg p-3 text-center shadow-sm"
                  >
                    <div className="text-3xl mb-2">{emoji}</div>
                    <div className="text-sm font-medium text-gray-900">{count} uses</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 italic">No emojis found in this chat</p>
              </div>
            )}
          </div>
        )}
        
        {/* Activity Timeline Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Message Activity Over Time</h3>
            
            {dailyActivity.length > 0 ? (
              <div className="h-80 w-full">
                <div className="h-full relative overflow-x-auto pb-5">
                  <div 
                    className="absolute left-0 top-0 h-[calc(100%-20px)] flex items-end space-x-1"
                    style={{ width: `${Math.max(dailyActivity.length * 10, 100)}%`, minWidth: '100%' }}
                  >
                    {dailyActivity.map(day => (
                      <div 
                        key={day.date} 
                        className="flex flex-col items-center"
                        title={`${formatDate(day.date)}: ${day.count} messages`}
                      >
                        <div 
                          className="w-5 rounded-t"
                          style={{ 
                            height: `${Math.min(Math.max(day.count * 3, 4), 220)}px`,
                            backgroundColor: day.sentiment > 0.3 
                              ? '#4ade80' // positive
                              : day.sentiment < -0.3 
                                ? '#f87171' // negative
                                : '#60a5fa' // neutral
                          }}
                        ></div>
                        {day.count > Math.max(...dailyActivity.map(d => d.count)) * 0.8 && (
                          <div className="absolute top-0 transform -translate-y-5 text-xs font-medium text-gray-900">
                            {day.count}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatDate(dailyActivity[0]?.date || '')}</span>
                  <span>{formatDate(dailyActivity[dailyActivity.length-1]?.date || '')}</span>
                </div>
                
                <div className="mt-4 flex items-center justify-center space-x-6">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#4ade80] rounded mr-1"></div>
                    <span className="text-xs text-gray-700">Positive</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#60a5fa] rounded mr-1"></div>
                    <span className="text-xs text-gray-700">Neutral</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#f87171] rounded mr-1"></div>
                    <span className="text-xs text-gray-700">Negative</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 italic">No activity data available</p>
              </div>
            )}
          </div>
        )}
        
        {/* Participant Stats Tab */}
        {activeTab === 'senders' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Participant Analysis</h3>
            
            {senderStats.length > 0 ? (
              <div className="space-y-8">
                {senderStats.map(sender => (
                  <div key={sender.sender} className="border-b pb-6 last:border-0">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-medium text-gray-900">{sender.sender}</h4>
                      <div className="bg-whatsapp-green-light text-gray-900 px-3 py-1 rounded-full text-sm">
                        {sender.messageCount} messages
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Average Message Length</p>
                        <p className="text-2xl font-bold text-gray-900">{sender.avgMessageLength} chars</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Message Frequency</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.round((sender.messageCount / messages.length) * 100)}%
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Favorite Emojis</p>
                        {sender.topEmojis.length > 0 ? (
                          <div className="flex space-x-2 mt-1">
                            {sender.topEmojis.map(({ emoji, count }) => (
                              <div key={emoji} className="text-center">
                                <div className="text-xl">{emoji}</div>
                                <div className="text-xs text-gray-500">{count}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No emojis used</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 italic">No participant data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsView;