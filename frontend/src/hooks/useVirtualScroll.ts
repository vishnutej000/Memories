import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVirtualScrollProps {
  itemCount: number;
  estimatedItemHeight: number;
  overscan?: number;
  getItemHeight?: (index: number) => number;
}

interface VirtualItem {
  index: number;
  start: number;
  end: number;
  size: number;
}

interface UseVirtualScrollReturn {
  virtualItems: VirtualItem[];
  totalHeight: number;
  startIndex: number;
  endIndex: number;
  scrollToIndex: (index: number) => void;
}

export const useVirtualScroll = ({
  itemCount,
  estimatedItemHeight,
  overscan = 5,
  getItemHeight,
}: UseVirtualScrollProps): UseVirtualScrollReturn => {
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(0);

  // For variable height items
  const itemHeightsRef = useRef<Record<number, number>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Observe viewport resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    setViewportHeight(container.clientHeight);
    
    const handleResize = () => {
      if (container) {
        setViewportHeight(container.clientHeight);
      }
    };
    
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Handle scroll
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Get item height
  const getItemHeightWithCache = useCallback((index: number): number => {
    if (getItemHeight) {
      // Compute and cache if we're using dynamic heights
      if (itemHeightsRef.current[index] === undefined) {
        itemHeightsRef.current[index] = getItemHeight(index);
      }
      return itemHeightsRef.current[index];
    }
    return estimatedItemHeight;
  }, [estimatedItemHeight, getItemHeight]);
  
  // Calculate item ranges and positions
  const calculateRanges = useCallback(() => {
    if (itemCount === 0) {
      return {
        virtualItems: [],
        totalHeight: 0,
        startIndex: 0,
        endIndex: 0,
      };
    }
    
    let totalHeight = 0;
    let startIndex = 0;
    let endIndex = 0;
    
    // Calculate total height and find visible range
    const ranges: { start: number; end: number; size: number }[] = new Array(itemCount);
    
    for (let i = 0; i < itemCount; i++) {
      const height = getItemHeightWithCache(i);
      const start = totalHeight;
      const end = start + height;
      
      ranges[i] = { start, end, size: height };
      totalHeight += height;
      
      // Check if this item is visible (with overscan)
      if (end < scrollTop - (overscan * estimatedItemHeight)) {
        startIndex = i + 1;
      }
      if (start > scrollTop + viewportHeight + (overscan * estimatedItemHeight) && endIndex === 0) {
        endIndex = i - 1;
      }
    }
    
    // If we haven't found an endIndex yet, it means all remaining items are visible
    if (endIndex === 0) {
      endIndex = itemCount - 1;
    }
    
    // Apply overscan
    startIndex = Math.max(0, startIndex - overscan);
    endIndex = Math.min(itemCount - 1, endIndex + overscan);
    
    // Create virtual items
    const virtualItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      virtualItems.push({
        index: i,
        start: ranges[i].start,
        end: ranges[i].end,
        size: ranges[i].size,
      });
    }
    
    return {
      virtualItems,
      totalHeight,
      startIndex,
      endIndex,
    };
  }, [itemCount, scrollTop, viewportHeight, overscan, estimatedItemHeight, getItemHeightWithCache]);
  
  // Calculate visible items
  const { virtualItems, totalHeight, startIndex, endIndex } = calculateRanges();
  
  // Scroll to a specific index
  const scrollToIndex = useCallback((index: number) => {
    if (!containerRef.current) return;
    
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeightWithCache(i);
    }
    
    containerRef.current.scrollTop = offset;
  }, [getItemHeightWithCache]);
  
  return {
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    scrollToIndex,
  };
};

export default useVirtualScroll;