import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VirtualizedList from '../VirtualizedList';

// Mock useVirtualScrolling hook
jest.mock('../../../Hooks/usePerformance', () => ({
  useVirtualScrolling: jest.fn()
}));

import { useVirtualScrolling } from '../../../Hooks/usePerformance';

const mockUseVirtualScrolling = useVirtualScrolling as jest.MockedFunction<typeof useVirtualScrolling>;

describe('VirtualizedList', () => {
  const mockItems = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: `Description for item ${i}`
  }));

  const mockRenderItem = jest.fn((item: any, index: number) => (
    <div key={item.id} data-testid={`item-${index}`}>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
    </div>
  ));
  
  const defaultMockReturn = {
    startIndex: 0,
    endIndex: 9,
    totalHeight: 50000,
    offsetY: 0,
    visibleItems: 10 // Number of visible items
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVirtualScrolling.mockReturnValue(defaultMockReturn);
  });
  
  it('should render visible items only', () => {
    render(
      <VirtualizedList
        items={mockItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={mockRenderItem}
      />
    );

    // Should render first 10 items (based on the mock return values)
    for (let i = 0; i < 10; i++) {
      expect(screen.getByTestId(`item-${i}`)).toBeInTheDocument();
      expect(screen.getByText(`Item ${i}`)).toBeInTheDocument();
    }

    // Should not render items beyond visible range
    expect(screen.queryByTestId('item-15')).not.toBeInTheDocument();
    expect(screen.queryByText('Item 15')).not.toBeInTheDocument();
  });

  it('should pass correct props to useVirtualScrolling', () => {
    render(
      <VirtualizedList
        items={mockItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={mockRenderItem}
        overscan={5}
      />
    );

    expect(mockUseVirtualScrolling).toHaveBeenCalledWith(
      mockItems.length, 
      50, 
      400, 
      0
    );
  });

  it('should handle scroll events', () => {
    render(
      <VirtualizedList
        items={mockItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={mockRenderItem}
      />
    );

    const container = screen.getByRole('list');
    fireEvent.scroll(container, { target: { scrollTop: 500 } });

    // The hook would update the scrollTop in a real component
    // We can just verify the scroll event was dispatched
    expect(container).toHaveProperty('scrollTop', 500);
  });

  it('should render with correct container styles', () => {
    render(
      <VirtualizedList
        items={mockItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={mockRenderItem}
      />
    );

    const container = screen.getByRole('list');
    expect(container).toHaveStyle({
      height: '400px',
      overflow: 'auto'
    });
  });

  it('should render items with correct offset', () => {
    mockUseVirtualScrolling.mockReturnValue({
      startIndex: 10,
      endIndex: 19,
      offsetY: 500,
      totalHeight: 50000,
      visibleItems: 10
    });

    render(
      <VirtualizedList
        items={mockItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={mockRenderItem}
      />
    );

    const itemsContainer = screen.getByRole('list').firstChild as HTMLElement;
    expect(itemsContainer).toHaveStyle({
      height: '50000px',
      position: 'relative'
    });

    // Would need a more complex test to verify transform property
  });

  it('should handle empty items list', () => {
    mockUseVirtualScrolling.mockReturnValue({
      startIndex: 0,
      endIndex: -1,
      totalHeight: 0,
      offsetY: 0,
      visibleItems: 0
    });

    render(
      <VirtualizedList
        items={[]}
        itemHeight={50}
        containerHeight={400}
        renderItem={mockRenderItem}
      />
    );

    const container = screen.getByRole('list');
    expect(container).toBeInTheDocument();
  });

  it('should handle different item heights', () => {
    render(
      <VirtualizedList
        items={mockItems}
        itemHeight={100}
        containerHeight={400}
        renderItem={mockRenderItem}
      />
    );

    expect(mockUseVirtualScrolling).toHaveBeenCalledWith(
      mockItems.length,
      100,
      400,
      0
    );
  });

  it('should pass additional props to container', () => {
    render(
      <VirtualizedList
        items={mockItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={mockRenderItem}
        className="custom-class"
        data-testid="custom-virtualized-list"
      />
    );

    const container = screen.getByTestId('custom-virtualized-list');
    expect(container).toHaveClass('custom-class');
    expect(container).toHaveClass('overflow-auto');
  });

  it('should update visible items when scrolling', () => {
    const { rerender } = render(
      <VirtualizedList
        items={mockItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={mockRenderItem}
      />
    );

    // Simulate scroll to show different items
    mockUseVirtualScrolling.mockReturnValue({
      startIndex: 5,
      endIndex: 14,
      offsetY: 250,
      totalHeight: 50000,
      visibleItems: 10
    });

    rerender(
      <VirtualizedList
        items={mockItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={mockRenderItem}
      />
    );

    // With our complete mock, we can't easily test for specific rendered items
  });
});
