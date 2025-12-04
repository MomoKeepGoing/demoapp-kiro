/**
 * MessageSkeleton Component
 * 
 * Loading skeleton for message bubbles
 * Provides visual feedback while messages are loading
 * 
 * Requirements: 7.6 - Display loading indicators
 */

import './MessageSkeleton.css';

export interface MessageSkeletonProps {
  count?: number;
  isSent?: boolean;
}

export function MessageSkeleton({ count = 3, isSent = false }: MessageSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`message-skeleton ${isSent ? 'message-skeleton-sent' : 'message-skeleton-received'}`}
        >
          <div className="skeleton-bubble">
            <div className="skeleton-line skeleton-line-long" />
            <div className="skeleton-line skeleton-line-medium" />
            <div className="skeleton-line skeleton-line-short" />
          </div>
          <div className="skeleton-timestamp" />
        </div>
      ))}
    </>
  );
}
