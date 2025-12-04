/**
 * MessagesPage Component Tests
 * 
 * Tests for the MessagesPage component functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MessagesPage } from './MessagesPage';
import * as messageApi from '../../utils/messageApi';

// Mock the message API
vi.mock('../../utils/messageApi', () => ({
  listConversations: vi.fn(),
  subscribeToMessages: vi.fn(() => vi.fn()),
  type: {} as any,
}));

// Mock Amplify data client
vi.mock('aws-amplify/data', () => ({
  generateClient: vi.fn(() => ({
    models: {
      Conversation: {
        onCreate: vi.fn(() => ({
          subscribe: vi.fn(() => ({
            unsubscribe: vi.fn(),
          })),
        })),
      },
    },
  })),
}));

describe('MessagesPage', () => {
  const mockCurrentUserId = 'user-123';
  const mockConversations = [
    {
      id: 'conv-1',
      userId: 'user-123',
      otherUserId: 'user-456',
      otherUserName: 'Alice',
      otherUserAvatar: null,
      lastMessageContent: 'Hello!',
      lastMessageAt: '2024-12-04T10:00:00Z',
      unreadCount: 2,
    },
    {
      id: 'conv-2',
      userId: 'user-123',
      otherUserId: 'user-789',
      otherUserName: 'Bob',
      otherUserAvatar: null,
      lastMessageContent: 'How are you?',
      lastMessageAt: '2024-12-04T09:00:00Z',
      unreadCount: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(messageApi.listConversations).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<MessagesPage currentUserId={mockCurrentUserId} />);

    // Check for skeleton loading state
    const skeletons = document.querySelectorAll('.conversation-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render conversation list after loading', async () => {
    vi.mocked(messageApi.listConversations).mockResolvedValue({
      conversations: mockConversations,
    });

    render(<MessagesPage currentUserId={mockCurrentUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('should display total unread count in header', async () => {
    vi.mocked(messageApi.listConversations).mockResolvedValue({
      conversations: mockConversations,
    });

    render(<MessagesPage currentUserId={mockCurrentUserId} />);

    await waitFor(() => {
      // Total unread: 2 + 0 = 2
      const badge = screen.getByLabelText('2 条未读消息');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('2');
    });
  });

  it('should render empty state when no conversations', async () => {
    vi.mocked(messageApi.listConversations).mockResolvedValue({
      conversations: [],
    });

    render(<MessagesPage currentUserId={mockCurrentUserId} />);

    await waitFor(() => {
      expect(screen.getByText('还没有对话')).toBeInTheDocument();
      expect(screen.getByText('从联系人列表开始新对话')).toBeInTheDocument();
    });
  });

  it('should sort conversations by lastMessageAt descending', async () => {
    vi.mocked(messageApi.listConversations).mockResolvedValue({
      conversations: mockConversations,
    });

    render(<MessagesPage currentUserId={mockCurrentUserId} />);

    await waitFor(() => {
      const conversationItems = screen.getAllByRole('button');
      // First conversation should be Alice (more recent)
      expect(conversationItems[0]).toHaveTextContent('Alice');
      // Second should be Bob (older)
      expect(conversationItems[1]).toHaveTextContent('Bob');
    });
  });

  it('should subscribe to new messages on mount', () => {
    vi.mocked(messageApi.listConversations).mockResolvedValue({
      conversations: [],
    });

    render(<MessagesPage currentUserId={mockCurrentUserId} />);

    expect(messageApi.subscribeToMessages).toHaveBeenCalledWith(
      mockCurrentUserId,
      expect.any(Function)
    );
  });
});
