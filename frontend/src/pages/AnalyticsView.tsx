import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { WhatsAppChat, ChatMessage, Message } from '../types';
import { getChat } from '../services/storageServices';
import { useSentimentAnalysis } from '../Hooks/useSentimentAnalysis';
import { getMostCommonWords, getMessageDistributionByTime } from '../utils/messageUtils';
import Button from '../Components/UI/Button';
import Tabs from '../Components/UI/Tabs';
import Spinner from '../Components/UI/Spinner';
import ActivityHeatmap from '../Components/Analysis/ActivityHeatmap';
import SentimentChart from '../Components/Analysis/SentimentChart';
import EmojiCloud from '../Components/Analysis/EmojiCloud';
import MessageStats from '../Components/Analysis/MessageStats';
import ChartComponent from '../Components/Analysis/ChartComponent';
import HappyMessages from '../Components/Analysis/HappyMessages';
import TimelineView from '../Components/Analysis/TimelineView';
import { HybridStorageService } from '../services/hybridStorageService';
import { PDFExporter } from '../services/pdfExport';

const AnalyticsView: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  
  // Chat data
  const [chat, setChat] = useState<WhatsAppChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'sentiment' | 'words' | 'emoji' | 'happy' | 'timeline'>('overview');
  
  // Analysis state
  const [activityData, setActivityData] = useState<Array<{ date: string; messageCount: number }>>([]);
  const [emojiData, setEmojiData] = useState<Array<{ emoji: string; count: number }>>([]);
  const [participantMessageCounts, setParticipantMessageCounts] = useState<Record<string, number>>({});
  const [timeDistribution, setTimeDistribution] = useState<Record<string, number>>({});
  
  // Get sentiment analysis functions
  const { analyzeSentiment, analyzeBatchSentiment, isAnalyzing } = useSentimentAnalysis();
  const [sentimentData, setSentimentData] = useState<Array<{ date: string; average: number; messages: number }>>([]);
  const [showAnalyzeButton, setShowAnalyzeButton] = useState(true);
  
  // Load chat data
  useEffect(() => {
    const loadChat = async () => {
      if (!chatId) {
        navigate('/404');
        return;
      }
      
      try {
        setIsLoading(true);
        const chatData = await getChat(chatId);
        setChat(chatData);
        
        // Generate activity data
        const messagesByDate: Record<string, number> = {};
        
        chatData.messages.forEach(message => {
          const date = new Date(message.timestamp).toISOString().split('T')[0];
          messagesByDate[date] = (messagesByDate[date] || 0) + 1;
        });
        
        // Convert to array and sort by date
        const activity = Object.entries(messagesByDate)
          .map(([date, messageCount]) => ({ date, messageCount }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        setActivityData(activity);
        
        // Generate emoji data
        const emojiCounts: Record<string, number> = {};
        
        chatData.messages.forEach(message => {
          if (!message.content) return;
          
          // Extract emojis
          const emojis = message.content.match(/[\p{Emoji_Presentation}\p{Emoji}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]/gu) || [];
          
          emojis.forEach(emoji => {
            emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
          });
        });
        
        // Convert to array and sort by count
        const emojiArray = Object.entries(emojiCounts)
          .map(([emoji, count]) => ({ emoji, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 50); // Limit to top 50 emojis
        
        setEmojiData(emojiArray);
        
        // Generate participant message counts
        const participantCounts: Record<string, number> = {};
        
        chatData.participants.forEach(participant => {
          participantCounts[participant] = chatData.messages.filter(m => m.sender === participant).length;
        });
        
        setParticipantMessageCounts(participantCounts);
        
        // Generate time distribution
        const timeDistrib = getMessageDistributionByTime(chatData.messages);
        setTimeDistribution(timeDistrib);
        
        // Check if messages already have sentiment scores
        const hasSentiment = chatData.messages.some(msg => typeof msg.sentimentScore === 'number');
        
        if (hasSentiment) {
          // Generate sentiment data
          const sentimentData = generateSentimentData(chatData.messages);
          setSentimentData(sentimentData);
          setShowAnalyzeButton(false);
        }
      } catch (err) {
        console.error('Error loading chat:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChat();
  }, [chatId, navigate]);
  
  // Generate sentiment data
  const generateSentimentData = (messages: ChatMessage[]) => {
    const sentimentByDate: Record<string, { total: number; count: number }> = {};
    
    messages.forEach(message => {
      if (typeof message.sentimentScore !== 'number') return;
      
      const date = new Date(message.timestamp).toISOString().split('T')[0];
      
      if (!sentimentByDate[date]) {
        sentimentByDate[date] = { total: 0, count: 0 };
      }
      
      sentimentByDate[date].total += message.sentimentScore;
      sentimentByDate[date].count += 1;
    });
    
    return Object.entries(sentimentByDate)
      .map(([date, { total, count }]) => ({
        date,
        average: total / count,
        messages: count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };
  
  // Handle sentiment analysis
  const handleAnalyzeSentiment = async () => {
    if (!chat) return;
    
    try {
      // Analyze messages
      const analyzedMessages = await Promise.all(
        chat.messages.map(async message => {
          if (!message.content) return message;
          
          const sentimentScore = await analyzeSentiment(message.content);
          return {
            ...message,
            sentimentScore
          };
        })
      );
      
      // Update chat with analyzed messages
      setChat({
        ...chat,
        messages: analyzedMessages
      });
      
      // Generate sentiment data
      const sentimentData = generateSentimentData(analyzedMessages);
      setSentimentData(sentimentData);
      
      // Hide analyze button
      setShowAnalyzeButton(false);
    } catch (err) {
      console.error('Error analyzing sentiment:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze sentiment');
    }
  };
  
  // Handle sharing a happy message
  const handleShareMessage = async (message: ChatMessage) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Happy Message from Chat',
          text: `${message.sender}: ${message.content}`,
          url: window.location.href
        });
      } else {
        // Fallback: Copy to clipboard
        const text = `${message.sender}: ${message.content}`;
        await navigator.clipboard.writeText(text);
        alert('Message copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing message:', err);
      alert('Failed to share message');
    }
  };

  // Handle exporting happy messages
  const handleExportMessages = async (messages: ChatMessage[]) => {
    try {
      if (!chat) return;

      // Convert ChatMessage[] to Message[]
      const exportMessages: Message[] = messages.map(msg => ({
        id: msg.id,
        timestamp: msg.timestamp,
        sender: msg.sender,
        content: msg.content,
        message_type: msg.isMedia ? 'Media' : 'Text',
        sentiment_score: msg.sentimentScore || null
      }));

      // Export as PDF
      await PDFExporter.exportToPDF({
        messages: exportMessages,
        currentUser: chat.participants[0], // Use first participant as current user
        pageSize: 'A4',
        orientation: 'portrait'
      });
    } catch (err) {
      console.error('Error exporting messages:', err);
      alert('Failed to export messages');
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Spinner size="large" text="Loading analytics..." />
      </div>
    );
  }
  
  // Render error state
  if (error || !chat) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Failed to load analytics</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Chat not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-whatsapp-dark hover:bg-whatsapp-teal text-white py-2 px-4 rounded-lg font-medium"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-whatsapp-teal dark:bg-gray-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Link to={`/chat/${chatId}`} className="mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold">Analytics: {chat.name}</h1>
          </div>
          
          <div className="flex space-x-2">
            <Link to={`/diary/${chatId}`}>
              <Button
                variant="outline"
                size="small"
                className="border-white text-white hover:bg-white/10"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                }
              >
                Journal
              </Button>
            </Link>
            
            <Link to={`/chat/${chatId}`}>
              <Button
                variant="outline"
                size="small"
                className="border-white text-white hover:bg-white/10"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
              >
                View Chat
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto py-6 px-4">
        {/* Tabs */}
        <Tabs
          tabs={[
            {
              id: 'overview',
              label: 'Overview',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              )
            },
            {
              id: 'activity',
              label: 'Activity',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )
            },
            {
              id: 'sentiment',
              label: 'Sentiment',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )
            },
            {
              id: 'words',
              label: 'Words',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              )
            },
            {
              id: 'emoji',
              label: 'Emoji',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )
            },
            {
              id: 'happy',
              label: 'Happy Messages',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )
            },
            {
              id: 'timeline',
              label: 'Timeline',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )
            }
          ]}
          activeTabId={activeTab}
          onChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
        />
        
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Chat Overview</h2>
                
                <MessageStats chat={chat} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Message Activity</h3>
                  <div className="h-64">
                    <ActivityHeatmap data={activityData} height={200} />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Message Distribution</h3>
                  <ChartComponent
                    type="pie"
                    data={{
                      labels: Object.keys(participantMessageCounts),
                      datasets: [{
                        data: Object.values(participantMessageCounts),
                        backgroundColor: [
                          '#25D366', '#128C7E', '#075E54', '#34B7F1',
                          '#ECE5DD', '#DCF8C6', '#FD8E13', '#9DE1FE'
                        ]
                      }]
                    }}
                    height={200}
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Message Activity</h2>
                <div className="mb-8">
                  <ActivityHeatmap data={activityData} height={300} />
                </div>
                
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Activity by Time of Day</h3>
                <div className="h-80">
                  <ChartComponent
                    type="bar"
                    data={{
                      labels: Object.keys(timeDistribution),
                      datasets: [{
                        label: 'Messages',
                        data: Object.values(timeDistribution),
                        backgroundColor: '#25D366',
                        borderColor: '#128C7E',
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Messages'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Messages Over Time</h3>
                <div className="h-80">
                  <ChartComponent
                    type="line"
                    data={{
                      labels: activityData.map(d => d.date),
                      datasets: [{
                        label: 'Messages per Day',
                        data: activityData.map(d => d.messageCount),
                        fill: false,
                        borderColor: '#25D366',
                        tension: 0.1
                      }]
                    }}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Messages'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Date'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'sentiment' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Sentiment Analysis</h2>
                  
                  {showAnalyzeButton && (
                    <Button
                      onClick={handleAnalyzeSentiment}
                      variant="primary"
                      disabled={isAnalyzing}
                      icon={isAnalyzing ? <Spinner size="small" color="white" /> : undefined}
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Sentiment'}
                    </Button>
                  )}
                </div>
                
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Spinner size="large" text="Analyzing sentiment..." />
                    <p className="text-gray-600 dark:text-gray-400 mt-4">
                      This may take a few moments depending on the number of messages.
                    </p>
                  </div>
                ) : sentimentData.length > 0 ? (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      This chart shows the average sentiment score of messages over time. Positive values indicate
                      positive sentiment, while negative values indicate negative sentiment.
                    </p>
                    
                    <div className="mb-8">
                      <SentimentChart data={sentimentData} height={300} />
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Sentiment Distribution</h3>
                    <div className="h-80">
                      <ChartComponent
                        type="bar"
                        data={{
                          labels: [
                            'Very Negative', 'Negative', 'Slightly Negative',
                            'Neutral',
                            'Slightly Positive', 'Positive', 'Very Positive'
                          ],
                          datasets: [{
                            label: 'Message Count',
                            data: [
                              chat.messages.filter(m => m.sentimentScore !== undefined && m.sentimentScore <= -0.75).length,
                              chat.messages.filter(m => m.sentimentScore !== undefined && m.sentimentScore > -0.75 && m.sentimentScore <= -0.5).length,
                              chat.messages.filter(m => m.sentimentScore !== undefined && m.sentimentScore > -0.5 && m.sentimentScore < -0.1).length,
                              chat.messages.filter(m => m.sentimentScore !== undefined && m.sentimentScore >= -0.1 && m.sentimentScore <= 0.1).length,
                              chat.messages.filter(m => m.sentimentScore !== undefined && m.sentimentScore > 0.1 && m.sentimentScore < 0.5).length,
                              chat.messages.filter(m => m.sentimentScore !== undefined && m.sentimentScore >= 0.5 && m.sentimentScore < 0.75).length,
                              chat.messages.filter(m => m.sentimentScore !== undefined && m.sentimentScore >= 0.75).length
                            ],
                            backgroundColor: [
                              '#ef4444', '#f87171', '#fca5a5',
                              '#9ca3af',
                              '#86efac', '#4ade80', '#22c55e'
                            ]
                          }]
                        }}
                        options={{
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Number of Messages'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                      No sentiment data available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Click the "Analyze Sentiment" button to analyze the sentiment of messages in this chat.
                    </p>
                  </div>
                )}
              </div>
              
              {sentimentData.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Sentiment by Participant</h3>
                  <div className="h-80">
                    <ChartComponent
                      type="bar"
                      data={{
                        labels: chat.participants,
                        datasets: [{
                          label: 'Average Sentiment',
                          data: chat.participants.map(participant => {
                            const participantMessages = chat.messages.filter(
                              m => m.sender === participant && m.sentimentScore !== undefined
                            );
                            
                            if (participantMessages.length === 0) return 0;
                            
                            const sum = participantMessages.reduce(
                              (acc, msg) => acc + (msg.sentimentScore || 0), 0
                            );
                            return sum / participantMessages.length;
                          }),
                          backgroundColor: '#25D366'
                        }]
                      }}
                      options={{
                        scales: {
                          y: {
                            min: -1,
                            max: 1,
                            title: {
                              display: true,
                              text: 'Average Sentiment Score'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'words' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Word Analysis</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Most Common Words</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Word</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Count</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {getMostCommonWords(chat.messages, 20).map((word, i) => (
                            <tr key={word.word}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{i + 1}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">{word.word}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{word.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Word Frequency</h3>
                    <div className="h-96">
                      <ChartComponent
                        type="bar"
                        data={{
                          labels: getMostCommonWords(chat.messages, 15).map(w => w.word),
                          datasets: [{
                            label: 'Word Count',
                            data: getMostCommonWords(chat.messages, 15).map(w => w.count),
                            backgroundColor: '#25D366'
                          }]
                        }}
                        options={{
                          indexAxis: 'y',
                          scales: {
                            x: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Frequency'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Words per Participant</h3>
                <div className="h-80">
                  <ChartComponent
                    type="bar"
                    data={{
                      labels: chat.participants,
                      datasets: [{
                        label: 'Average Words per Message',
                        data: chat.participants.map(participant => {
                          const participantMessages = chat.messages.filter(m => m.sender === participant && !m.isMedia && !m.isDeleted);
                          
                          if (participantMessages.length === 0) return 0;
                          
                          const wordCount = participantMessages.reduce((acc, msg) => {
                            const words = msg.content.split(/\s+/).filter(w => w.length > 0);
                            return acc + words.length;
                          }, 0);
                          
                          return wordCount / participantMessages.length;
                        }),
                        backgroundColor: '#25D366'
                      }]
                    }}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Average Words per Message'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'emoji' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Emoji Analysis</h2>
                
                {emojiData.length > 0 ? (
                  <div>
                    <div className="mb-8">
                      <EmojiCloud data={emojiData} size="large" />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Top Emojis</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Emoji</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Count</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {emojiData.slice(0, 20).map((emoji, i) => (
                                <tr key={i}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{i + 1}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-2xl">{emoji.emoji}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{emoji.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Emoji Distribution</h3>
                        <div className="h-96">
                          <ChartComponent
                            type="pie"
                            data={{
                              labels: emojiData.slice(0, 10).map(e => e.emoji),
                              datasets: [{
                                data: emojiData.slice(0, 10).map(e => e.count),
                                backgroundColor: [
                                  '#25D366', '#128C7E', '#075E54', '#34B7F1',
                                  '#ECE5DD', '#DCF8C6', '#FD8E13', '#9DE1FE',
                                  '#9EE7FF', '#E9EDEF'
                                ]
                              }]
                            }}
                            options={{
                              plugins: {
                                tooltip: {
                                  callbacks: {
                                    label: function(context: any) {
                                      const label = context.label || '';
                                      const value = context.raw;
                                      const total = context.dataset.data.reduce((acc: number, curr: number) => acc + curr, 0);
                                      const percentage = Math.round((value as number / total) * 100);
                                      return `${label}: ${value} (${percentage}%)`;
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                      No emoji data available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      There are no emojis in this chat or we couldn't detect any.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Emoji Usage by Participant</h3>
                <div className="h-80">
                  <ChartComponent
                    type="bar"
                    data={{
                      labels: chat.participants,
                      datasets: [{
                        label: 'Total Emojis Used',
                        data: chat.participants.map(participant => {
                          const participantMessages = chat.messages.filter(m => m.sender === participant);
                          return participantMessages.reduce((acc, msg) => acc + (msg.emojiCount || 0), 0);
                        }),
                        backgroundColor: '#25D366'
                      }]
                    }}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Emoji Count'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'happy' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                  Happy Messages
                </h2>
                <HappyMessages
                  messages={chat?.messages || []}
                  onShare={handleShareMessage}
                  onExport={handleExportMessages}
                />
              </div>
            </div>
          )}
          
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                  Message Timeline
                </h2>
                <TimelineView
                  messages={chat?.messages || []}
                  onMessageClick={(message) => {
                    // Implement message click functionality
                    console.log('Message clicked:', message);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalyticsView;