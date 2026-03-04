import { useState, useEffect } from 'react';

/**
 * A custom React hook that returns the current browser window width (breakpoint).
 *
 * It listens to the window resize event and updates automatically.
 *
 * @example
 * const breakpoint = useBreakpoint();
 * const is_mobile = breakpoint < 480;
 *
 * @returns {number} The current window width in pixels.
 */

export function useBreakpoint(): number {
  const [breakpoint, setBreakpoint] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setBreakpoint(window.innerWidth);

    window.addEventListener('resize', handleResize);

    // Run it once at mount
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}
