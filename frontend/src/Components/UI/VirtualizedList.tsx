import React, { useState, useEffect, useRef, memo } from 'react';
import { useVirtualScrolling } from '../../Hooks/usePerformance';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

function VirtualizedListComponent<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 3
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    startIndex,
    endIndex,
    totalHeight,
    offsetY
  } = useVirtualScrolling(
    items.length,
    itemHeight,
    containerHeight,
    scrollTop
  );

  // Add overscan to reduce flickering
  const startWithOverscan = Math.max(0, startIndex - overscan);
  const endWithOverscan = Math.min(items.length - 1, endIndex + overscan);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const visibleItems = items.slice(startWithOverscan, endWithOverscan + 1);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY + (startWithOverscan - startIndex) * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startWithOverscan + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startWithOverscan + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const VirtualizedList = memo(VirtualizedListComponent) as <T>(
  props: VirtualizedListProps<T>
) => JSX.Element;

export default VirtualizedList;
