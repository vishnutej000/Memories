import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChat} from '../services/storageServices';
import { WhatsAppChat, ChatMessage, SearchCriteria } from '../types';
import { useSearch } from '../Hooks/useSearch';
import { getHighActivityDays } from '../utils/messageUtils';

import ChatHeader from '../Components/Whatsapp/ChatHeader';
import MessageList, { MessageListRef } from '../Components/Whatsapp/MessageList';
import UserSelector from '../Components/Whatsapp/UserSelector';
import Spinner from '../Components/UI/Spinner';
import Modal from '../Components/UI/Modal';
import SearchBar from '../Components/Search/SearchBar';
import SearchResultsList from '../Components/Search/SearchResultsList';
import ExportOptions from '../Components/Export/ExportOptions';
import DatePicker from '../Components/UI/DatePicker';
import Button from '../Components/UI/Button';

const WhatsAppViewer: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const messageListRef = useRef<MessageListRef>(null);
  
  // Chat data state
  const [chat, setChat] = useState<WhatsAppChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    // UI state
  const [showSearch, setShowSearch] = useState(false);
  const [showJumpToDate, setShowJumpToDate] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [viewAs, setViewAs] = useState<string>('You'); // Default view as self
  const [filterMode, setFilterMode] = useState<'all' | 'participant'>('all'); // Message filter mode
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchResultIndex, setSelectedSearchResultIndex] = useState(-1);
  const { 
    search, 
    searchResults, 
    isSearching, 
    searchError 
  } = useSearch();
    // Date jump state
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [keyEventDates, setKeyEventDates] = useState<Set<string>>(new Set());
    // Computed values
  const displayedMessageCount = useMemo(() => {
    if (!chat) return 0;
    if (filterMode === 'participant') {
      return chat.messages.filter(msg => msg.sender === viewAs).length;
    }
    return chat.messageCount;
  }, [chat, filterMode, viewAs]);
  
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
        
        // Set default "viewAs" to current user
        // In a real app, this would be determined by authentication
        if (chatData.participants.includes('You')) {
          setViewAs('You');
        } else {
          setViewAs(chatData.participants[0]);
        }
        
        // Find high activity days
        const keyDates = getHighActivityDays(chatData.messages, 0.9);
        setKeyEventDates(new Set(keyDates));
        
      } catch (err) {
        console.error('Error loading chat:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChat();
  }, [chatId, navigate]);
  
  // Handle search
  const handleSearch = async () => {
    if (!chat || !searchQuery.trim()) return;
    
    // Create search criteria
    const criteria: SearchCriteria = {
      chatId: chat.id,
      query: searchQuery
    };
    
    // Execute search
    await search(criteria);
    
    // Reset selected result
    setSelectedSearchResultIndex(-1);
  };
  
  // Handle search result selection
  const handleSelectSearchResult = (message: ChatMessage) => {
    // Find index of selected message in search results
    const index = searchResults.findIndex(m => m.id === message.id);
    if (index !== -1) {
      setSelectedSearchResultIndex(index);
    }
    
    // Scroll to message in chat
    if (messageListRef.current) {
      messageListRef.current.scrollToMessage(message.id);
    }
  };
  
  // Handle jump to date
  const handleJumpToDate = (date: string) => {
    setSelectedDate(date);
    setShowJumpToDate(false);
    
    // Scroll to date
    if (messageListRef.current) {
      messageListRef.current.scrollToDate(date);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Spinner size="large" text="Loading chat..." />
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
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Failed to load chat</h2>
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
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <ChatHeader
        chat={chat}
        onSearch={() => setShowSearch(true)}
        onExport={() => setShowExportModal(true)}
      />
      
      {/* Main chat area */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full flex flex-col">          {/* Toolbar */}
          <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">View as:</span>
                <UserSelector
                  participants={chat.participants}
                  value={viewAs}
                  onChange={setViewAs}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Filter:</span>
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      filterMode === 'all'
                        ? 'bg-whatsapp-dark text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    All Messages
                  </button>
                  <button
                    onClick={() => setFilterMode('participant')}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      filterMode === 'participant'
                        ? 'bg-whatsapp-dark text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {viewAs} Only
                  </button>
                </div>
              </div>
              
              <Button
                onClick={() => setShowJumpToDate(true)}
                variant="outline"
                size="small"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              >
                Jump to Date
              </Button>
            </div>            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {displayedMessageCount.toLocaleString()} messages
              {filterMode === 'participant' && (
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-500">
                  (filtered)
                </span>
              )}
            </div>
          </div>
            {/* Messages */}          <MessageList
            ref={messageListRef}
            messages={chat.messages}
            currentUser={viewAs}
            keyEventDates={keyEventDates}
            filterMode={filterMode}
            selectedParticipant={viewAs}
          />
        </div>
      </div>
      
      {/* Search Modal */}
      <Modal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        title="Search Messages"
      >
        <div className="space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Search for messages..."
            autofocus
          />
          
          <SearchResultsList
            results={searchResults}
            isLoading={isSearching}
            selectedIndex={selectedSearchResultIndex}
            onSelect={handleSelectSearchResult}
            onClose={() => setShowSearch(false)}
          />
          
          {searchError && (
            <div className="text-red-500 dark:text-red-400 text-sm">
              {searchError}
            </div>
          )}
        </div>
      </Modal>
      
      {/* Jump to Date Modal */}
      <Modal
        isOpen={showJumpToDate}
        onClose={() => setShowJumpToDate(false)}
        title="Jump to Date"
        size="small"
      >
        <div className="space-y-4">
          <DatePicker
            startDate={chat.startDate}
            endDate={chat.endDate}
            onSelectDate={handleJumpToDate}
            highlightDates={Array.from(keyEventDates)}
            selectedDate={selectedDate}
          />
        </div>
      </Modal>
      
      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Chat"
        size="medium"
      >
        <ExportOptions
          chat={chat}
          onClose={() => setShowExportModal(false)}
        />
      </Modal>
    </div>
  );
};

export default WhatsAppViewer;