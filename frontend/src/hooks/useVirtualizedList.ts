import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for virtualized lists
 */
export function useVirtualizedList<T>({
  items,
  estimatedItemHeight,
  overscan = 3,
  scrollingDelay = 150
}: {
  items: T[];
  estimatedItemHeight: number;
  overscan?: number;
  scrollingDelay?: number;
}) {
  const [visibleIndices, setVisibleIndices] = useState<[number, number]>([0, 10]);
  const [isScrolling, setIsScrolling] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);
  
  // Recalculate visible indices when scrolling or resizing
  const calculateVisibleIndices = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, clientHeight } = containerRef.current;
    setContainerHeight(clientHeight);
    
    // Calculate visible items based on estimated height
    const startIndex = Math.max(0, Math.floor(scrollTop / estimatedItemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + clientHeight) / estimatedItemHeight) + overscan
    );
    
    setVisibleIndices([startIndex, endIndex]);
  };
  
  // Handle scroll events
  const handleScroll = () => {
    setIsScrolling(true);
    calculateVisibleIndices();
    
    // Clear previous timeout
    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set timeout to detect when scrolling stops
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, scrollingDelay);
  };
  
  // Set up resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(() => {
      calculateVisibleIndices();
    });
    
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // Recalculate when items change
  useEffect(() => {
    calculateVisibleIndices();
  }, [items.length, estimatedItemHeight, overscan]);
  
  // Clean up timeout
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  // Calculate visible items
  const visibleItems = items.slice(visibleIndices[0], visibleIndices[1] + 1);
  
  // Calculate scrollTo function for moving to specific items
  const scrollToItem = (index: number, behavior: ScrollBehavior = 'auto') => {
    if (!containerRef.current) return;
    
    const scrollTop = index * estimatedItemHeight;
    containerRef.current.scrollTo({
      top: scrollTop,
      behavior
    });
  };
  
  return {
    containerRef,
    visibleItems,
    visibleIndices,
    isScrolling,
    containerHeight,
    handleScroll,
    scrollToItem
  };
}