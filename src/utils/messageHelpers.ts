/**
 * Message Helper Utilities
 * 
 * This module provides utility functions for message handling including:
 * - Time formatting (today/yesterday/full date)
 * - Message content validation
 * - Conversation ID generation
 * - Unread count calculation
 * - Timestamp display logic
 */

/**
 * Format message timestamp based on when it was sent
 * - Today: "14:30"
 * - Yesterday: "昨天 14:30"
 * - Earlier: "2024-01-15 14:30"
 * 
 * Validates: Requirements 9.2, 9.3, 9.4
 */
export function formatMessageTime(timestamp: string | Date): string {
  const messageDate = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  
  // Reset time to midnight for date comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  
  // Format time as HH:mm
  const hours = messageDate.getHours().toString().padStart(2, '0');
  const minutes = messageDate.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  
  // Today: only show time
  if (messageDay.getTime() === today.getTime()) {
    return timeStr;
  }
  
  // Yesterday: show "昨天" + time
  if (messageDay.getTime() === yesterday.getTime()) {
    return `昨天 ${timeStr}`;
  }
  
  // Earlier: show full date + time
  const year = messageDate.getFullYear();
  const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
  const day = messageDate.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${timeStr}`;
}

/**
 * Validate message content
 * - Must not be empty or only whitespace
 * - Must not exceed 5000 characters
 * 
 * Validates: Requirements 1.2, 1.3
 * 
 * @returns Object with isValid flag and optional error message
 */
export function validateMessageContent(content: string): { 
  isValid: boolean; 
  error?: string 
} {
  // Check if empty or only whitespace
  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      error: '消息内容不能为空'
    };
  }
  
  // Check character limit
  if (content.length > 5000) {
    return {
      isValid: false,
      error: '消息内容不能超过5000个字符'
    };
  }
  
  return { isValid: true };
}

/**
 * Generate conversation ID for a user pair
 * Each user maintains their own conversation record, so the ID is directional
 * Format: userId_otherUserId
 * 
 * NOTE: This is for Conversation records (user-specific).
 * For Message records, use the sorted version from messageApi.ts
 * 
 * Validates: Requirements 1.1, 2.1
 */
export function generateConversationId(userId: string, otherUserId: string): string {
  return `${userId}_${otherUserId}`;
}

/**
 * Calculate unread message count from a list of messages
 * Counts messages where isRead is false and receiverId matches current user
 * 
 * Validates: Requirements 4.4, 11.5
 */
export function calculateUnreadCount(
  messages: Array<{ isRead: boolean; receiverId: string }>,
  currentUserId: string
): number {
  return messages.filter(
    msg => !msg.isRead && msg.receiverId === currentUserId
  ).length;
}

/**
 * Determine if timestamp should be shown for a message
 * Show timestamp if:
 * - It's the first message, OR
 * - Time gap from previous message is >= 5 minutes
 * 
 * Validates: Requirements 9.1, 9.5
 */
export function shouldShowTimestamp(
  currentMessageTime: string | Date,
  previousMessageTime?: string | Date
): boolean {
  // Always show for first message
  if (!previousMessageTime) {
    return true;
  }
  
  const currentTime = typeof currentMessageTime === 'string' 
    ? new Date(currentMessageTime) 
    : currentMessageTime;
  const prevTime = typeof previousMessageTime === 'string'
    ? new Date(previousMessageTime)
    : previousMessageTime;
  
  // Calculate time difference in minutes
  const diffMs = currentTime.getTime() - prevTime.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  
  // Show timestamp if gap is 5 minutes or more
  return diffMinutes >= 5;
}
