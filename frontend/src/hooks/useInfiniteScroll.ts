import { useRef, useEffect, useState, useCallback } from 'react';

interface UseInfiniteScrollOptions {
    onLoadMore: () => Promise<void>;
    hasMore: boolean;
    threshold?: number;
}

interface UseInfiniteScrollReturn {
    containerRef: React.RefObject<HTMLDivElement>;
    loading: boolean;
}

export const useInfiniteScroll = ({
    onLoadMore,
    hasMore,
    threshold = 200
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);

    const handleScroll = useCallback(async () => {
        if (!containerRef.current || !hasMore || loading) return;

        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        
        // Check if we're near the top (for loading more messages above)
        if (scrollTop <= threshold) {
            setLoading(true);
            try {
                await onLoadMore();
            } catch (error) {
                console.error('Error loading more data:', error);
            } finally {
                setLoading(false);
            }
        }
    }, [onLoadMore, hasMore, loading, threshold]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    return {
        containerRef,
        loading
    };
};
