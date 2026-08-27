import { useEffect, useRef } from 'react';

/**
 * usePolling Hook
 * Periodically executes a callback (e.g. fetching queue states, live token passes)
 */
export function usePolling(callback: () => void | Promise<void>, intervalMs: number = 4000, enabled: boolean = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    // Call immediately on mount
    savedCallback.current();

    const id = setInterval(() => {
      savedCallback.current();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
