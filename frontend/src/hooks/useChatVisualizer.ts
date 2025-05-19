import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types/chat.types';

interface ChatVirualizerProps {
  messages: ChatMessage[];
  itemsPerPage: number;
  initialLoading: boolean;
}

interface DayMarker {
  isDay: true;
  date: string;
}

type ChatItem = ChatMessage | DayMarker;

export const useChatVirtualizer = ({
  messages,
  itemsPerPage,
  initialLoading
}: ChatVirualizerProps) => {
  const [groupedItems, setGroupedItems] = useState<ChatItem[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemSizeCache = useRef<{[key: number]: number}>({});
  const loadingTimeoutRef = useRef<number | null>(null);

  // Group messages by day
  useEffect(() => {
    if (messages.length === 0) return;
    
    const grouped: ChatItem[] = [];
    let currentDay: string | null = null;
    
    messages.forEach(message => {
      // Add day separator if it's a new day
      if (message.date !== currentDay) {
        grouped.push({ isDay: true, date: message.date });
        currentDay = message.date;
      }
      
      grouped.push(message);
    });
    
    setGroupedItems(grouped);
    
    // Reset item size cache when messages change
    itemSizeCache.current = {};
  }, [messages]);

  // Check if an item at a specific index is loaded
  const isItemLoaded = useCallback((index: number) => {
    return index < groupedItems.length;
  }, [groupedItems]);

  // Load more items
  const loadMoreItems = useCallback(async () => {
    if (isNextPageLoading || !hasNextPage) return;
    
    setIsNextPageLoading(true);
    
    // Simulate loading more data (in a real app, this would call fetchMessages)
    if (loadingTimeoutRef.current) {
      window.clearTimeout(loadingTimeoutRef.current);
    }
    
    loadingTimeoutRef.current = window.setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setIsNextPageLoading(false);
      
      // If we've loaded all pages, set hasNextPage to false
      if (currentPage * itemsPerPage >= messages.length) {
        setHasNextPage(false);
      }
    }, 500);
  }, [isNextPageLoading, hasNextPage, currentPage, itemsPerPage, messages.length]);

  // Get the height for a specific item
  const getItemSize = useCallback((index: number) => {
    // Return cached height if available
    if (itemSizeCache.current[index]) {
      return itemSizeCache.current[index];
    }
    
    // Default heights
    const item = groupedItems[index];
    if (!item) return 50; // Loading placeholder height
    
    // Day divider default height
    if ('isDay' in item) return 40;
    
    // Default message height based on content length
    const contentLength = item.content.length;
    let defaultHeight = 70; // Base height
    
    if (contentLength > 100) defaultHeight += 20;
    if (contentLength > 200) defaultHeight += 20;
    if (item.type !== 'text') defaultHeight += 150; // Media messages
    
    return defaultHeight;
  }, [groupedItems]);

  // Store the measured height for an item
  const setMeasuredItemHeight = useCallback((index: number, height: number) => {
    itemSizeCache.current[index] = height;
  }, []);

  return {
    groupedItems,
    isItemLoaded,
    loadMoreItems,
    isNextPageLoading,
    hasNextPage,
    getItemSize,
    setMeasuredItemHeight,
    totalItems: initialLoading ? 0 : groupedItems.length
  };
};