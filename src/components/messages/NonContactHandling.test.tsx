/**
 * Non-Contact Message Handling Tests
 * 
 * Tests for Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ConversationView } from './ConversationView';
import { ConversationListItem } from './ConversationListItem';
import * as contactApi from '../../utils/contactApi';
import * as messageApi from '../../utils/messageApi';

// Mock the APIs
vi.mock('../../utils/contactApi');
vi.mock('../../utils/messageApi');
vi.mock('aws-amplify/storage', () => ({
  getUrl: vi.fn().mockResolvedValue({ url: new URL('https://example.com/avatar.jpg') }),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe('Non-Contact Message Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ConversationView - Non-Contact Detection', () => {
    it('should detect and display non-contact status', async () => {
      // Requirement 10.2: WHEN 显示非联系人对话 THEN 消息系统 SHALL 标记该用户为非联系人状态
      vi.mocked(contactApi.isContact).mockResolvedValue(false);
      vi.mocked(messageApi.listMessages).mockResolvedValue({ messages: [] });
      vi.mocked(messageApi.subscribeToMessages).mockReturnValue(() => {});
      vi.mocked(messageApi.markConversationAsRead).mockResolvedValue();

      render(
        <ConversationView
          conversationId="user1_user2"
          otherUserId="user2"
          otherUserName="Test User"
          currentUserId="user1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('非联系人')).toBeInTheDocument();
      });
    });

    it('should show "Add as Contact" button for non-contacts', async () => {
      // Requirement 10.3: WHEN 用户查看非联系人对话 THEN 消息系统 SHALL 提供添加为联系人的选项
      vi.mocked(contactApi.isContact).mockResolvedValue(false);
      vi.mocked(messageApi.listMessages).mockResolvedValue({ messages: [] });
      vi.mocked(messageApi.subscribeToMessages).mockReturnValue(() => {});
      vi.mocked(messageApi.markConversationAsRead).mockResolvedValue();

      render(
        <ConversationView
          conversationId="user1_user2"
          otherUserId="user2"
          otherUserName="Test User"
          currentUserId="user1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('添加联系人')).toBeInTheDocument();
      });
    });

    it('should not show "Add as Contact" button for existing contacts', async () => {
      vi.mocked(contactApi.isContact).mockResolvedValue(true);
      vi.mocked(messageApi.listMessages).mockResolvedValue({ messages: [] });
      vi.mocked(messageApi.subscribeToMessages).mockReturnValue(() => {});
      vi.mocked(messageApi.markConversationAsRead).mockResolvedValue();

      render(
        <ConversationView
          conversationId="user1_user2"
          otherUserId="user2"
          otherUserName="Test User"
          currentUserId="user1"
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('添加联系人')).not.toBeInTheDocument();
      });
    });

    it('should call createContact when "Add as Contact" button is clicked', async () => {
      // Requirement 10.5: WHEN 用户将非联系人添加为联系人 THEN 消息系统 SHALL 更新对话状态为联系人对话
      vi.mocked(contactApi.isContact).mockResolvedValue(false);
      vi.mocked(contactApi.createContact).mockResolvedValue({
        userId: 'user1',
        contactUserId: 'user2',
        contactUsername: 'Test User',
        createdAt: new Date().toISOString(),
      });
      vi.mocked(messageApi.listMessages).mockResolvedValue({ messages: [] });
      vi.mocked(messageApi.subscribeToMessages).mockReturnValue(() => {});
      vi.mocked(messageApi.markConversationAsRead).mockResolvedValue();

      render(
        <ConversationView
          conversationId="user1_user2"
          otherUserId="user2"
          otherUserName="Test User"
          currentUserId="user1"
        />
      );

      const addButton = await screen.findByText('添加联系人');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(contactApi.createContact).toHaveBeenCalledWith('user1', {
          userId: 'user2',
          username: 'Test User',
          avatarUrl: undefined,
          email: '',
        });
      });
    });

    it('should update UI after successfully adding contact', async () => {
      vi.mocked(contactApi.isContact).mockResolvedValue(false);
      vi.mocked(contactApi.createContact).mockResolvedValue({
        userId: 'user1',
        contactUserId: 'user2',
        contactUsername: 'Test User',
        createdAt: new Date().toISOString(),
      });
      vi.mocked(messageApi.listMessages).mockResolvedValue({ messages: [] });
      vi.mocked(messageApi.subscribeToMessages).mockReturnValue(() => {});
      vi.mocked(messageApi.markConversationAsRead).mockResolvedValue();

      render(
        <ConversationView
          conversationId="user1_user2"
          otherUserId="user2"
          otherUserName="Test User"
          currentUserId="user1"
        />
      );

      const addButton = await screen.findByText('添加联系人');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('已添加为联系人')).toBeInTheDocument();
      });
    });
  });

  describe('ConversationListItem - Non-Contact Indicator', () => {
    it('should show non-contact indicator for non-contacts', async () => {
      // Requirement 10.2: WHEN 显示非联系人对话 THEN 消息系统 SHALL 标记该用户为非联系人状态
      vi.mocked(contactApi.isContact).mockResolvedValue(false);

      const conversation = {
        id: 'user1_user2',
        otherUserId: 'user2',
        otherUserName: 'Test User',
        lastMessageContent: 'Hello',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      };

      render(
        <ConversationListItem
          conversation={conversation}
          currentUserId="user1"
          onClick={() => {}}
        />
      );

      await waitFor(() => {
        const indicator = screen.getByTitle('非联系人');
        expect(indicator).toBeInTheDocument();
        expect(indicator).toHaveTextContent('⚠');
      });
    });

    it('should not show non-contact indicator for existing contacts', async () => {
      vi.mocked(contactApi.isContact).mockResolvedValue(true);

      const conversation = {
        id: 'user1_user2',
        otherUserId: 'user2',
        otherUserName: 'Test User',
        lastMessageContent: 'Hello',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      };

      render(
        <ConversationListItem
          conversation={conversation}
          currentUserId="user1"
          onClick={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.queryByTitle('非联系人')).not.toBeInTheDocument();
      });
    });
  });

  describe('Non-Contact Message Sending', () => {
    it('should allow sending messages to non-contacts', async () => {
      // Requirement 10.4: WHEN 用户向非联系人发送消息 THEN 消息系统 SHALL 允许发送并创建对话
      vi.mocked(contactApi.isContact).mockResolvedValue(false);
      vi.mocked(messageApi.listMessages).mockResolvedValue({ messages: [] });
      vi.mocked(messageApi.subscribeToMessages).mockReturnValue(() => {});
      vi.mocked(messageApi.markConversationAsRead).mockResolvedValue();
      vi.mocked(messageApi.sendMessage).mockResolvedValue({
        id: 'msg1',
        senderId: 'user1',
        receiverId: 'user2',
        conversationId: 'user1_user2',
        content: 'Hello non-contact',
        status: 'sent',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      render(
        <ConversationView
          conversationId="user1_user2"
          otherUserId="user2"
          otherUserName="Test User"
          currentUserId="user1"
        />
      );

      const input = await screen.findByPlaceholderText('输入消息...');
      fireEvent.change(input, { target: { value: 'Hello non-contact' } });

      const sendButton = screen.getByText('发送');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(messageApi.sendMessage).toHaveBeenCalledWith(
          'user2',
          'Hello non-contact',
          'user1',
          'Test User',
          undefined
        );
      });
    });
  });
});
