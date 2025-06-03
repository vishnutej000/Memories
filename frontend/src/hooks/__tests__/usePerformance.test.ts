import { renderHook, act } from '@testing-library/react';
import { 
  useMemoizedValue, 
  useDebounce, 
  useThrottle, 
  useIntersectionObserver,
  useVirtualScrolling 
} from '../usePerformance';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

describe('usePerformance hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useMemoizedValue', () => {
    it('should memoize expensive calculations', () => {
      const expensiveCalculation = jest.fn((input: number) => input * 2);

      const { result, rerender } = renderHook(
        ({ input }) => useMemoizedValue(() => expensiveCalculation(input), [input]),
        { initialProps: { input: 5 } }
      );

      expect(result.current).toBe(10);
      expect(expensiveCalculation).toHaveBeenCalledTimes(1);

      // Re-render with same input
      rerender({ input: 5 });
      expect(expensiveCalculation).toHaveBeenCalledTimes(1); // Should not recalculate

      // Re-render with different input
      rerender({ input: 10 });
      expect(result.current).toBe(20);
      expect(expensiveCalculation).toHaveBeenCalledTimes(2);
    });
  });

  describe('useDebounce', () => {
    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBe('initial');

      // Change value rapidly
      rerender({ value: 'change1' });
      rerender({ value: 'change2' });
      rerender({ value: 'final' });

      // Should still be initial value
      expect(result.current).toBe('initial');

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should now be the final value
      expect(result.current).toBe('final');
    });

    it('should reset timer on new changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'change1' });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });

      rerender({ value: 'change2' });
      
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should still be initial (timer was reset)
      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Now should be final value
      expect(result.current).toBe('change2');
    });
  });

  describe('useThrottle', () => {
    it('should throttle function calls', () => {
      const mockFn = jest.fn();
      const { result } = renderHook(() => useThrottle(mockFn, 500));

      // Call multiple times rapidly
      act(() => {
        result.current('arg1');
        result.current('arg2');
        result.current('arg3');
      });

      // Should only be called once
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Call again
      act(() => {
        result.current('arg4');
      });

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('arg4');
    });
  });

  describe('useIntersectionObserver', () => {
    it('should observe element intersection', () => {
      const mockElement = document.createElement('div');
      const { result } = renderHook(() => useIntersectionObserver());

      expect(result.current.isIntersecting).toBe(false);

      act(() => {
        result.current.elementRef.current = mockElement;
      });

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          rootMargin: '0px',
          threshold: 0
        })
      );
    });
  });

  describe('useVirtualScrolling', () => {
    const mockItems = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
    const mockContainer = {
      offsetHeight: 400,
      scrollTop: 0
    };

    it('should calculate visible items correctly', () => {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        value: 400,
      });

      const { result } = renderHook(() => 
        useVirtualScrolling({
          items: mockItems,
          itemHeight: 50,
          containerHeight: 400,
          overscan: 2
        })
      );

      expect(result.current.visibleItems).toHaveLength(10); // 400/50 + 2 overscan
      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(9);
      expect(result.current.totalHeight).toBe(50000); // 1000 * 50
    });

    it('should update on scroll', () => {
      const { result } = renderHook(() => 
        useVirtualScrolling({
          items: mockItems,
          itemHeight: 50,
          containerHeight: 400,
          overscan: 2
        })
      );

      act(() => {
        result.current.onScroll({ target: { scrollTop: 500 } } as any);
      });

      expect(result.current.startIndex).toBe(8); // 500/50 - 2 overscan
      expect(result.current.visibleItems).toHaveLength(10);
    });
  });
});
