/**
 * MessageBubble Component
 * 
 * Displays a single message in a chat conversation with WhatsApp-style design.
 * 
 * Features:
 * - Multi-line text support
 * - Timestamp display using formatMessageTime
 * - Message status indicators (sending/sent/failed)
 * - Different styles for sent vs received messages
 * - Retry functionality for failed messages
 * 
 * Validates: Requirements 3.5, 3.6, 5.1, 5.2, 5.3, 5.4, 9.1
 */

import { formatMessageTime } from '../../utils/messageHelpers';
import './MessageBubble.css';
import './animations.css';
import './responsive.css';

export interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    createdAt: string;
    status: 'sending' | 'sent' | 'failed';
    senderId: string;
  };
  currentUserId: string;
  showTimestamp?: boolean;
  onRetry?: (messageId: string) => void;
}

export function MessageBubble({ 
  message, 
  currentUserId, 
  showTimestamp = true,
  onRetry 
}: MessageBubbleProps) {
  const isSent = message.senderId === currentUserId;
  const formattedTime = formatMessageTime(message.createdAt);
  
  const handleRetryClick = () => {
    if (message.status === 'failed' && onRetry) {
      onRetry(message.id);
    }
  };
  
  return (
    <div 
      className={`message-bubble-container ${isSent ? 'sent' : 'received'}`}
      role="article"
      aria-label={`${isSent ? '已发送' : '已接收'}消息`}
    >
      <div 
        className={`message-bubble ${isSent ? 'sent' : 'received'} ${message.status}`}
        onClick={message.status === 'failed' ? handleRetryClick : undefined}
        role={message.status === 'failed' ? 'button' : undefined}
        tabIndex={message.status === 'failed' ? 0 : undefined}
        aria-label={message.status === 'failed' ? '重新发送失败的消息' : undefined}
        onKeyDown={(e) => {
          if (message.status === 'failed' && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleRetryClick();
          }
        }}
      >
        <div className="message-content" aria-label="消息内容">{message.content}</div>
        
        <div className="message-footer">
          {showTimestamp && (
            <span className="message-time" aria-label={`发送时间: ${formattedTime}`}>
              {formattedTime}
            </span>
          )}
          
          {isSent && (
            <span className="message-status" aria-label={`消息状态: ${getStatusLabel(message.status)}`}>
              {getStatusIcon(message.status)}
            </span>
          )}
        </div>
        
        {message.status === 'failed' && (
          <div className="message-error-hint" role="alert">点击重试</div>
        )}
      </div>
    </div>
  );
}

/**
 * Get status icon based on message status
 * - sending: clock icon
 * - sent: single checkmark
 * - failed: exclamation mark
 */
function getStatusIcon(status: 'sending' | 'sent' | 'failed'): string {
  switch (status) {
    case 'sending':
      return '🕐'; // Clock icon for sending
    case 'sent':
      return '✓'; // Single checkmark for sent
    case 'failed':
      return '⚠'; // Warning icon for failed
    default:
      return '';
  }
}

/**
 * Get accessible status label for screen readers
 */
function getStatusLabel(status: 'sending' | 'sent' | 'failed'): string {
  switch (status) {
    case 'sending':
      return '发送中';
    case 'sent':
      return '已发送';
    case 'failed':
      return '发送失败';
    default:
      return '';
  }
}
