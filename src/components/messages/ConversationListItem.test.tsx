/**
 * ConversationListItem Component Tests
 * 
 * Tests for the conversation list item component including:
 * - Rendering conversation information
 * - Avatar display with fallback
 * - Message preview truncation
 * - Time formatting
 * - Unread badge display
 * - Click interaction
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationListItem } from './ConversationListItem';

// Mock the Storage API
vi.mock('aws-amplify/storage', () => ({
  getUrl: vi.fn().mockResolvedValue({
    url: new URL('https://example.com/avatar.jpg')
  })
}));

describe('ConversationListItem', () => {
  const mockConversation = {
    id: 'conv-1',
    otherUserId: 'user-123',
    otherUserName: '张三',
    otherUserAvatar: 'profile-pictures/123/avatar.jpg',
    lastMessageContent: '你好，最近怎么样？',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
  };

  it('should render conversation information', () => {
    const onClick = vi.fn();
    render(<ConversationListItem conversation={mockConversation} currentUserId="current-user" onClick={onClick} />);
    
    // Check if user name is displayed
    expect(screen.getByText('张三')).toBeInTheDocument();
    
    // Check if last message is displayed
    expect(screen.getByText('你好，最近怎么样？')).toBeInTheDocument();
  });

  it('should display avatar placeholder when no avatar URL', () => {
    const conversationWithoutAvatar = {
      ...mockConversation,
      otherUserAvatar: null,
    };
    const onClick = vi.fn();
    
    render(<ConversationListItem conversation={conversationWithoutAvatar} currentUserId="current-user" onClick={onClick} />);
    
    // Check if placeholder with first letter is displayed
    expect(screen.getByText('张')).toBeInTheDocument();
  });

  it('should truncate long messages to 100 characters', () => {
    const longMessage = 'a'.repeat(150);
    const conversationWithLongMessage = {
      ...mockConversation,
      lastMessageContent: longMessage,
    };
    const onClick = vi.fn();
    
    render(<ConversationListItem conversation={conversationWithLongMessage} currentUserId="current-user" onClick={onClick} />);
    
    // Check if message is truncated with ellipsis
    const preview = screen.getByText(/^a+\.\.\.$/);
    expect(preview.textContent?.length).toBeLessThanOrEqual(103); // 100 chars + '...'
  });

  it('should display unread badge when unreadCount > 0', () => {
    const conversationWithUnread = {
      ...mockConversation,
      unreadCount: 5,
    };
    const onClick = vi.fn();
    
    render(<ConversationListItem conversation={conversationWithUnread} currentUserId="current-user" onClick={onClick} />);
    
    // Check if unread badge is displayed
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByLabelText('5 条未读消息')).toBeInTheDocument();
  });

  it('should not display unread badge when unreadCount is 0', () => {
    const onClick = vi.fn();
    render(<ConversationListItem conversation={mockConversation} currentUserId="current-user" onClick={onClick} />);
    
    // Check that unread badge is not present
    const badge = screen.queryByLabelText(/条未读消息/);
    expect(badge).not.toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    
    render(<ConversationListItem conversation={mockConversation} currentUserId="current-user" onClick={onClick} />);
    
    const item = screen.getByRole('button');
    fireEvent.click(item);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should call onClick when Enter key is pressed', () => {
    const onClick = vi.fn();
    
    render(<ConversationListItem conversation={mockConversation} currentUserId="current-user" onClick={onClick} />);
    
    const item = screen.getByRole('button');
    fireEvent.keyDown(item, { key: 'Enter' });
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should call onClick when Space key is pressed', () => {
    const onClick = vi.fn();
    
    render(<ConversationListItem conversation={mockConversation} currentUserId="current-user" onClick={onClick} />);
    
    const item = screen.getByRole('button');
    fireEvent.keyDown(item, { key: ' ' });
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should have proper accessibility attributes', () => {
    const onClick = vi.fn();
    render(<ConversationListItem conversation={mockConversation} currentUserId="current-user" onClick={onClick} />);
    
    const item = screen.getByRole('button');
    expect(item).toHaveAttribute('tabIndex', '0');
    expect(item).toHaveAttribute('aria-label');
  });
});
