import { useState, useEffect } from 'react';

/**
 * Custom hook for media queries
 */
export function useMediaQuery(query: string): boolean {
  // Initialize to false for SSR
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // Check if window exists (for SSR)
    if (typeof window === 'undefined') return;
    
    // Create media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);
    
    // Define handler function
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add event listener
    mediaQuery.addEventListener('change', handler);
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);
  
  return matches;
}