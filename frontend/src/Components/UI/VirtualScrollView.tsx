import React, { useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';

interface VirtualScrollViewProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimatedItemHeight: number;
  overscan?: number;
  className?: string;
}

type VirtualScrollViewRef = {
  scrollToItem: (index: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  getCurrentScrollPosition: () => number;
};

const VirtualScrollView = forwardRef<VirtualScrollViewRef, VirtualScrollViewProps<any>>(
  ({ items, renderItem, estimatedItemHeight, overscan = 2, className = '' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [itemHeights, setItemHeights] = useState<Record<number, number>>({});
    
    // Calculate container height when mounted
    useEffect(() => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
        
        // Add resize observer to update when container size changes
        const resizeObserver = new ResizeObserver((entries) => {
          setContainerHeight(entries[0].contentRect.height);
        });
        
        resizeObserver.observe(containerRef.current);
        
        return () => {
          if (containerRef.current) {
            resizeObserver.unobserve(containerRef.current);
          }
        };
      }
    }, []);
    
    // Handle scroll event
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    };
    
    // Calculate which items are visible
    const { startIndex, endIndex, startOffset, totalHeight } = useMemo(() => {
      // Calculate total content height and item positions
      let totalHeight = 0;
      const itemPositions: number[] = [0]; // start positions of each item
      
      items.forEach((_, index) => {
        const height = itemHeights[index] || estimatedItemHeight;
        totalHeight += height;
        itemPositions.push(totalHeight);
      });
      
      // Find start index (first item that is visible)
      let startIndex = itemPositions.findIndex(pos => pos > scrollTop) - 1;
      startIndex = Math.max(0, startIndex);
      
      // Calculate start offset (for proper positioning)
      const startOffset = itemPositions[startIndex];
      
      // Find end index (last item that is visible + overscan)
      let endIndex = itemPositions.findIndex(pos => pos > scrollTop + containerHeight);
      if (endIndex === -1) endIndex = items.length;
      endIndex = Math.min(items.length, endIndex + overscan);
      
      // Apply overscan to start as well
      startIndex = Math.max(0, startIndex - overscan);
      
      return { startIndex, endIndex, startOffset, totalHeight };
    }, [items, itemHeights, scrollTop, containerHeight, estimatedItemHeight, overscan]);
    
    // Expose scroll methods to parent component via ref
    useImperativeHandle(ref, () => ({
      scrollToItem: (index: number) => {
        if (containerRef.current && index >= 0 && index < items.length) {
          // Calculate position to scroll to
          let position = 0;
          for (let i = 0; i < index; i++) {
            position += itemHeights[i] || estimatedItemHeight;
          }
          containerRef.current.scrollTop = position;
        }
      },
      scrollToTop: () => {
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      },
      scrollToBottom: () => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      },
      getCurrentScrollPosition: () => scrollTop
    }));
    
    // Measure rendered item heights
    const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
    
    useEffect(() => {
      const newItemHeights = { ...itemHeights };
      let hasChanges = false;
      
      // Check heights of visible items
      for (let i = startIndex; i < endIndex; i++) {
        const itemElement = itemRefs.current[i];
        if (itemElement) {
          const height = itemElement.getBoundingClientRect().height;
          if (height > 0 && height !== newItemHeights[i]) {
            newItemHeights[i] = height;
            hasChanges = true;
          }
        }
      }
      
      // Update heights if changed
      if (hasChanges) {
        setItemHeights(newItemHeights);
      }
    }, [startIndex, endIndex, items]);
    
    return (
      <div
        ref={containerRef}
        className={`overflow-auto ${className}`}
        onScroll={handleScroll}
      >
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
          <div style={{ transform: `translateY(${startOffset}px)` }}>
            {items.slice(startIndex, endIndex).map((item, index) => {
              const actualIndex = startIndex + index;
              return (
                <div
                  key={actualIndex}
                  ref={el => {
                    itemRefs.current[actualIndex] = el;
                  }}
                >
                  {renderItem(item, actualIndex)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

VirtualScrollView.displayName = 'VirtualScrollView';

export default VirtualScrollView;