/**
 * useSubscription Hook
 * 
 * Custom hook for managing GraphQL subscriptions with automatic reconnection
 * Implements exponential backoff strategy for reconnection attempts
 * 
 * Requirements: 7.6 - Subscription reconnection with exponential backoff
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseSubscriptionOptions<T> {
  subscribe: () => { unsubscribe: () => void };
  onData: (data: T) => void;
  onError?: (error: any) => void;
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

export function useSubscription<T>({
  subscribe,
  onData: _onData,
  onError,
  maxRetries = 5,
  initialDelay = 1000,
  maxDelay = 30000,
}: UseSubscriptionOptions<T>) {
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const calculateDelay = useCallback((attempt: number): number => {
    // Exponential backoff: delay = initialDelay * 2^attempt
    const delay = initialDelay * Math.pow(2, attempt);
    return Math.min(delay, maxDelay);
  }, [initialDelay, maxDelay]);

  const attemptConnection = useCallback(() => {
    if (isUnmountedRef.current) return;

    try {
      cleanup();

      // Create subscription with error handling wrapper
      const originalSubscription = subscribe();
      
      subscriptionRef.current = {
        unsubscribe: () => {
          try {
            originalSubscription.unsubscribe();
          } catch (err) {
            console.error('Error unsubscribing:', err);
          }
        },
      };

      setIsConnected(true);
      setRetryCount(0);
    } catch (error) {
      console.error('Subscription error:', error);
      setIsConnected(false);

      if (onError) {
        onError(error);
      }

      // Attempt reconnection with exponential backoff
      if (retryCount < maxRetries) {
        const delay = calculateDelay(retryCount);
        console.log(`Reconnecting in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (!isUnmountedRef.current) {
            setRetryCount((prev) => prev + 1);
            attemptConnection();
          }
        }, delay);
      } else {
        console.error('Max reconnection attempts reached');
        if (onError) {
          onError(new Error('无法连接到服务器，请刷新页面重试'));
        }
      }
    }
  }, [subscribe, onError, retryCount, maxRetries, calculateDelay, cleanup]);

  // Initial connection
  useEffect(() => {
    isUnmountedRef.current = false;
    attemptConnection();

    return () => {
      isUnmountedRef.current = true;
      cleanup();
    };
  }, []);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    setRetryCount(0);
    attemptConnection();
  }, [attemptConnection]);

  return {
    isConnected,
    retryCount,
    reconnect,
  };
}
