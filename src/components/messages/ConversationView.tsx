/**
 * ConversationView Component
 * 
 * Displays a one-on-one chat conversation with WhatsApp-style design.
 * 
 * Features:
 * - Conversation header with user info (name and avatar)
 * - Message list using MessageBubble components
 * - Auto-scroll to latest message
 * - Infinite scroll for loading message history
 * - Fixed bottom input box
 * - Send button (Enter to send, Shift+Enter for newline)
 * - Auto-adjusting input height (max 4 lines)
 * - Real-time message subscription
 * - Auto-mark as read when viewing conversation
 * - Loading and empty states
 * 
 * Validates: Requirements 1.1, 1.4, 1.5, 2.2, 3.1, 3.3, 3.7, 8.1, 8.2, 8.3, 8.4, 8.5, 11.4
 */

import { useState, useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageSkeleton } from './MessageSkeleton';
import { 
  listMessages, 
  sendMessage, 
  markConversationAsRead,
  type Message,
  type MessageError 
} from '../../utils/messageApi';
import { validateMessageContent, shouldShowTimestamp } from '../../utils/messageHelpers';
import { isContact, createContact, type UserProfile } from '../../utils/contactApi';
import { generateClient } from 'aws-amplify/data';
import { getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../../amplify/data/resource';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../ToastContainer';
import './ConversationView.css';
import './animations.css';
import './responsive.css';

const client = generateClient<Schema>();

export interface ConversationViewProps {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  currentUserId: string;
  onBack?: () => void;
  registerMessageHandler?: (handler: (message: Message) => void) => void; // Register handler with parent
}

export function ConversationView({
  conversationId,
  otherUserId,
  otherUserName,
  currentUserId,
  onBack,
  registerMessageHandler,
}: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isContactUser, setIsContactUser] = useState<boolean | null>(null);
  const [addingContact, setAddingContact] = useState(false);
  const [contactAdded, setContactAdded] = useState(false);
  const [isSubscriptionConnected] = useState(true);
  const [subscriptionRetryCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialLoad = useRef(true);
  const previousScrollHeight = useRef(0);
  // const subscriptionRef = useRef<(() => void) | null>(null);
  // const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Toast notifications
  const { toasts, showError, showSuccess, removeToast } = useToast();

  // Load user profile and avatar
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: profile } = await client.models.UserProfile.get({
          userId: otherUserId,
        });
        
        if (profile?.avatarUrl) {
          const result = await getUrl({ path: profile.avatarUrl });
          setAvatarUrl(result.url.toString());
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      }
    };
    
    loadUserProfile();
  }, [otherUserId]);

  // Check if other user is a contact
  // Requirement 10.2: WHEN 显示非联系人对话 THEN 消息系统 SHALL 标记该用户为非联系人状态
  useEffect(() => {
    const checkContactStatus = async () => {
      try {
        const isContactResult = await isContact(currentUserId, otherUserId);
        setIsContactUser(isContactResult);
      } catch (err) {
        console.error('Error checking contact status:', err);
        setIsContactUser(false);
      }
    };
    
    checkContactStatus();
  }, [currentUserId, otherUserId, contactAdded]);

  // Load initial messages
  useEffect(() => {
    loadInitialMessages();
  }, [conversationId]);

  // Subscribe to new messages for this conversation
  useEffect(() => {
    console.log('[ConversationView] Setting up message subscription');
    
    const sortedIds = [currentUserId, otherUserId].sort();
    const messageConversationId = `${sortedIds[0]}_${sortedIds[1]}`;
    
    const messageSub = client.models.Message.onCreate().subscribe({
      next: (data) => {
        console.log('[ConversationView] Received new message:', data);
        
        // Only process messages for this conversation
        if (data && data.conversationId === messageConversationId) {
          console.log('[ConversationView] Message is for this conversation');
          
          // Skip messages sent by current user (already added via optimistic update)
          if (data.senderId === currentUserId) {
            console.log('[ConversationView] Message is from current user, skipping (already added optimistically)');
            return;
          }
          
          setMessages((prev) => {
            // Check if message already exists
            if (prev.some((m) => m.id === data.id)) {
              console.log('[ConversationView] Message already exists, skipping');
              return prev;
            }
            
            console.log('[ConversationView] Adding new message to list');
            const newMessage: Message = {
              id: data.id,
              conversationId: data.conversationId,
              senderId: data.senderId,
              receiverId: data.receiverId,
              content: data.content,
              status: 'sent',
              isRead: data.isRead ?? false,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
            };
            
            return [...prev, newMessage];
          });
          
          // Scroll to bottom
          // Note: No need to mark as read here, App.tsx already handles it when user is viewing
          setTimeout(() => scrollToBottom(), 100);
        }
      },
      error: (err) => console.error('[ConversationView] Message subscription error:', err),
    });

    return () => {
      console.log('[ConversationView] Cleaning up message subscription');
      messageSub.unsubscribe();
    };
  }, [currentUserId, otherUserId, conversationId]);

  // NOTE: Subscription is handled by MessagesPage to avoid duplicate subscriptions
  // ConversationView receives new messages through MessagesPage's subscription
  // This prevents the "subscription filter uses same fieldName multiple time" error
  
  // Register message handler with parent
  useEffect(() => {
    if (registerMessageHandler) {
      const handleMessage = (message: Message) => {
        console.log('[ConversationView] Received message from parent:', message);
        
        // Only add messages for this conversation
        const sortedIds = [currentUserId, otherUserId].sort();
        const messageConversationId = `${sortedIds[0]}_${sortedIds[1]}`;
        
        console.log('[ConversationView] Comparing IDs:', {
          messageConversationId: message.conversationId,
          expectedConversationId: messageConversationId,
          match: message.conversationId === messageConversationId
        });
        
        if (message.conversationId === messageConversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) {
              console.log('[ConversationView] Message already exists');
              return prev;
            }
            console.log('[ConversationView] Adding new message');
            return [...prev, message];
          });
          
          setTimeout(() => scrollToBottom(), 100);
        }
      };
      
      registerMessageHandler(handleMessage);
      
      // Cleanup: unregister on unmount
      return () => registerMessageHandler(() => {});
    }
  }, [registerMessageHandler, currentUserId, otherUserId, conversationId]);

  // Mark conversation as read when viewing
  // Requirement 11.4: WHEN 用户查看对话 THEN 消息系统 SHALL 将该对话的消息标记为已读
  useEffect(() => {
    if (!loading && messages.length > 0) {
      // Async execution - doesn't block UI rendering
      markConversationAsRead(conversationId, currentUserId, otherUserId);
    }
  }, [conversationId, currentUserId, otherUserId, loading, messages.length]);

  // Auto-scroll to bottom on initial load and new messages
  useEffect(() => {
    if (isInitialLoad.current && messages.length > 0) {
      scrollToBottom();
      isInitialLoad.current = false;
    }
  }, [messages]);

  const loadInitialMessages = async () => {
    try {
      setLoading(true);
      
      // Requirement 11.3: WHEN 用户打开对话 THEN 消息系统 SHALL 显示该对话的所有未读消息
      // This loads all messages including offline messages (isRead = false)
      // NOTE: Messages use sorted conversation ID, so we need to generate it
      const sortedIds = [currentUserId, otherUserId].sort();
      const messageConversationId = `${sortedIds[0]}_${sortedIds[1]}`;
      const result = await listMessages(messageConversationId, 50);
      setMessages(result.messages);
      setNextToken(result.nextToken);
      setHasMore(!!result.nextToken);
    } catch (err: any) {
      console.error('Error loading messages:', err);
      
      // Requirement 1.6, 1.7: Handle network and authorization errors
      const error = err as MessageError;
      if (error.type === 'AUTHORIZATION') {
        showError('您没有权限查看此对话');
        // Return to conversation list after a delay
        setTimeout(() => {
          if (onBack) onBack();
        }, 2000);
      } else if (error.type === 'SYSTEM') {
        showError(error.message || '加载消息失败，请检查网络连接');
      } else {
        showError(error.message || '加载消息失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMore || loadingMore || !nextToken) return;

    try {
      setLoadingMore(true);
      const container = messagesContainerRef.current;
      if (container) {
        previousScrollHeight.current = container.scrollHeight;
      }

      // NOTE: Messages use sorted conversation ID
      const sortedIds = [currentUserId, otherUserId].sort();
      const messageConversationId = `${sortedIds[0]}_${sortedIds[1]}`;
      const result = await listMessages(messageConversationId, 50, nextToken);
      
      // Prepend older messages
      setMessages((prev) => [...result.messages, ...prev]);
      setNextToken(result.nextToken);
      setHasMore(!!result.nextToken);

      // Restore scroll position after loading more messages
      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - previousScrollHeight.current;
        }
      }, 0);
    } catch (err: any) {
      console.error('Error loading more messages:', err);
      const error = err as MessageError;
      showError(error.message || '加载历史消息失败');
    } finally {
      setLoadingMore(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Load more when scrolled to top
    if (container.scrollTop === 0 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height (max 4 lines)
    const lineHeight = 24; // Approximate line height in pixels
    const maxHeight = lineHeight * 4;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    
    textarea.style.height = `${newHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    // Validate message content
    const validation = validateMessageContent(inputText);
    if (!validation.isValid) {
      showError(validation.error || '消息内容无效');
      return;
    }

    try {
      setSending(true);

      // Requirement 1.6, 1.7: Optimistic update - add message immediately with 'sending' status
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: currentUserId,
        receiverId: otherUserId,
        conversationId,
        content: inputText,
        status: 'sending',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, optimisticMessage]);
      
      // Clear input and reset height
      const contentToSend = inputText;
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Scroll to bottom
      setTimeout(() => scrollToBottom(), 100);

      // Send message
      const sentMessage = await sendMessage(
        otherUserId,
        contentToSend,
        currentUserId,
        otherUserName
      );

      // Replace optimistic message with real message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMessage.id ? sentMessage : m))
      );
    } catch (err: any) {
      console.error('Error sending message:', err);
      
      // Requirement 1.6, 1.7: Handle errors with toast notifications
      const error = err as MessageError;
      if (error.type === 'AUTHORIZATION') {
        showError('您没有权限发送消息');
      } else if (error.type === 'VALIDATION') {
        showError(error.message || '消息内容无效');
      } else if (error.type === 'SYSTEM') {
        showError(error.message || '发送失败，请检查网络连接');
      } else {
        showError(error.message || '发送失败');
      }
      
      // Mark optimistic message as failed
      setMessages((prev) =>
        prev.map((m) =>
          m.status === 'sending' ? { ...m, status: 'failed' as const } : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleRetry = async (messageId: string) => {
    const failedMessage = messages.find((m) => m.id === messageId);
    if (!failedMessage) return;

    try {
      // Update status to sending
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: 'sending' as const } : m))
      );

      // Requirement 5.4: Retry sending failed message
      const sentMessage = await sendMessage(
        otherUserId,
        failedMessage.content,
        currentUserId,
        otherUserName
      );

      // Replace with successful message
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? sentMessage : m))
      );
      
      showSuccess('消息已发送');
    } catch (err: any) {
      console.error('Error retrying message:', err);
      
      const error = err as MessageError;
      showError(error.message || '重试失败');
      
      // Mark as failed again
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: 'failed' as const } : m))
      );
    }
  };

  // Handle adding user as contact
  // Requirement 10.3: WHEN 用户查看非联系人对话 THEN 消息系统 SHALL 提供添加为联系人的选项
  // Requirement 10.4: WHEN 用户向非联系人发送消息 THEN 消息系统 SHALL 允许发送并创建对话
  // Requirement 10.5: WHEN 用户将非联系人添加为联系人 THEN 消息系统 SHALL 更新对话状态为联系人对话
  const handleAddContact = async () => {
    try {
      setAddingContact(true);

      // Get latest user profile
      const { data: profile } = await client.models.UserProfile.get({
        userId: otherUserId,
      });

      const targetUser: UserProfile = {
        userId: otherUserId,
        username: profile?.username || otherUserName,
        avatarUrl: profile?.avatarUrl || null,
        email: profile?.email || '',
      };

      await createContact(currentUserId, targetUser);
      
      // Update state to reflect contact added
      setContactAdded(true);
      setIsContactUser(true);
      
      showSuccess('已添加为联系人');
    } catch (err: any) {
      console.error('Error adding contact:', err);
      showError(err.message || '添加联系人失败');
    } finally {
      setAddingContact(false);
    }
  };

  return (
    <div className="conversation-view">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Connection status indicator */}
      {!isSubscriptionConnected && subscriptionRetryCount > 0 && (
        <div className="connection-status" role="alert">
          <span className="status-icon">⚠️</span>
          <span>连接断开，正在重试... ({subscriptionRetryCount}/5)</span>
        </div>
      )}
      
      {/* Header */}
      <div className="conversation-header">
        {onBack && (
          <button
            className="btn-back"
            onClick={onBack}
            aria-label="返回对话列表"
          >
            ←
          </button>
        )}
        
        <div className="header-user-info">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={otherUserName}
              className="header-avatar"
            />
          ) : (
            <div className="header-avatar-placeholder">
              {otherUserName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="header-user-details">
            <span className="header-username">{otherUserName}</span>
            {isContactUser === false && (
              <span className="non-contact-badge">非联系人</span>
            )}
          </div>
        </div>

        {/* Add as Contact button for non-contacts */}
        {isContactUser === false && !contactAdded && (
          <button
            className="btn-success"
            onClick={handleAddContact}
            disabled={addingContact}
            aria-label="添加为联系人"
          >
            {addingContact ? '添加中...' : '添加联系人'}
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        className="messages-container"
        ref={messagesContainerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label="消息历史"
      >
        {loadingMore && (
          <div className="loading-more">
            <MessageSkeleton count={2} />
          </div>
        )}
        
        {loading ? (
          <div className="loading-state">
            <MessageSkeleton count={5} isSent={false} />
            <MessageSkeleton count={3} isSent={true} />
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <p>还没有消息</p>
            <p className="empty-hint">发送第一条消息开始对话</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : undefined;
              const showTimestamp = shouldShowTimestamp(
                message.createdAt || new Date().toISOString(),
                prevMessage?.createdAt || undefined
              );

              return (
                <MessageBubble
                  key={message.id}
                  message={{
                    id: message.id,
                    content: message.content,
                    createdAt: message.createdAt || new Date().toISOString(),
                    status: message.status,
                    senderId: message.senderId,
                  }}
                  currentUserId={currentUserId}
                  showTimestamp={showTimestamp}
                  onRetry={handleRetry}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Box */}
      <div className="input-container">
        <div className="input-box">
          <textarea
            ref={textareaRef}
            className="message-input"
            placeholder="输入消息..."
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={sending}
            rows={1}
            aria-label="消息输入框"
          />
          
          <button
            className="btn-primary"
            onClick={handleSend}
            disabled={sending || !inputText.trim()}
            aria-label="发送消息"
          >
            {sending ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}
