/**
 * ConversationSkeleton Component
 * 
 * Loading skeleton for conversation list items
 * Provides visual feedback while conversations are loading
 * 
 * Requirements: 7.6 - Display loading indicators
 */

import './ConversationSkeleton.css';

export interface ConversationSkeletonProps {
  count?: number;
}

export function ConversationSkeleton({ count = 5 }: ConversationSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="conversation-skeleton">
          <div className="skeleton-avatar" />
          <div className="skeleton-content">
            <div className="skeleton-header">
              <div className="skeleton-name" />
              <div className="skeleton-time" />
            </div>
            <div className="skeleton-message" />
          </div>
        </div>
      ))}
    </>
  );
}
